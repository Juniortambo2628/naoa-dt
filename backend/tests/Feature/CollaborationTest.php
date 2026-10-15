<?php

namespace Tests\Feature;

use App\Mail\CollaboratorInvitation;
use App\Models\Faq;
use App\Models\Guest;
use App\Models\Revision;
use App\Models\Setting;
use App\Models\SongRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class CollaborationTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['name' => 'Dinah']);
    }

    public function test_settings_changes_are_versioned_and_restorable(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/settings', ['settings' => ['bride_name' => 'Dinah']])->assertOk();
        $this->travel(11)->minutes();
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/settings', ['settings' => ['bride_name' => 'Dina', 'groom_name' => 'Tze Ren']])->assertOk();

        $history = $this->actingAs($this->admin, 'sanctum')->getJson('/api/revisions?module=settings')->assertOk();
        $first = collect($history->json('data.data'))->first(fn ($r) => $r['action'] === 'created' && $r['subject_label'] === 'bride_name');
        $this->assertNotNull($first);

        $update = collect($history->json('data.data'))->firstWhere('action', 'updated');
        $this->assertSame([['field' => 'value', 'before' => 'Dinah', 'after' => 'Dina']], $update['changes']);
        $this->assertSame('Dinah', $update['user']['name']);

        // Restore the first version of bride_name.
        $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/revisions/{$first['id']}/restore")->assertOk();
        $this->assertSame('Dinah', Setting::getValue('bride_name'));
        $this->assertDatabaseHas('revisions', ['action' => 'restored', 'subject_label' => 'bride_name']);
    }

    public function test_quick_successive_edits_merge_into_one_version(): void
    {
        foreach (['A', 'B', 'C'] as $theme) {
            $this->actingAs($this->admin, 'sanctum')
                ->postJson('/api/settings', ['settings' => ['invitation_theme' => ['bg' => $theme]]])->assertOk();
        }

        $versions = Revision::where('module', 'design')->get();
        $this->assertCount(2, $versions); // created + one merged update
        $update = $versions->firstWhere('action', 'updated');
        $this->assertSame(json_encode(['bg' => 'A']), $update->beforeData()['value']);
        $this->assertSame(json_encode(['bg' => 'C']), $update->afterData()['value']);
    }

    public function test_deleted_records_can_be_restored(): void
    {
        $faq = Faq::create(['question' => 'Dress code?', 'answer' => 'Formal', 'order' => 1]);
        $this->actingAs($this->admin, 'sanctum')->deleteJson("/api/faqs/{$faq->id}")->assertOk();
        $this->assertDatabaseMissing('faqs', ['id' => $faq->id]);

        $deletion = Revision::where('module', 'faqs')->where('action', 'deleted')->firstOrFail();
        $this->actingAs($this->admin, 'sanctum')->postJson("/api/revisions/{$deletion->id}/restore")->assertOk();

        $this->assertDatabaseHas('faqs', ['id' => $faq->id, 'question' => 'Dress code?']);
    }

    public function test_soft_deleted_guest_is_restored(): void
    {
        $guest = Guest::factory()->create(['name' => 'Jane']);
        $guest->delete();

        $deletion = Revision::where('action', 'deleted')->where('subject_id', $guest->id)->firstOrFail();
        $this->assertSame('guests', $deletion->module);
        $this->actingAs($this->admin, 'sanctum')->postJson("/api/revisions/{$deletion->id}/restore")->assertOk();

        $this->assertNotSoftDeleted('guests', ['id' => $guest->id]);
    }

    public function test_guest_changes_are_filed_under_the_right_module(): void
    {
        $guest = Guest::factory()->create();
        $guest->update(['rsvp_status' => 'attending']);
        $guest->update(['location_lat' => 1.23]); // noise: no version

        $this->assertSame(['guests', 'rsvps'], Revision::orderBy('id')->pluck('module')->all());
    }

    public function test_heartbeat_reports_presence_and_badges_for_others_changes(): void
    {
        $partner = User::factory()->create(['name' => 'Tze Ren']);

        // Both start counting from their first heartbeat.
        $this->actingAs($this->admin, 'sanctum')->postJson('/api/collaboration/heartbeat', ['module' => 'dashboard'])->assertOk();
        $this->actingAs($partner, 'sanctum')->postJson('/api/collaboration/heartbeat', ['module' => 'seating', 'path' => '/admin/dashboard/seating'])->assertOk();

        $this->travel(1)->seconds();
        SongRequest::create(['song_data' => ['id' => 'x'], 'song_title' => 'Perfect', 'artist' => 'Ed Sheeran', 'guest_name' => 'Guest']);
        $this->actingAs($this->admin, 'sanctum')->postJson('/api/settings', ['settings' => ['bride_name' => 'Dinah']]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/collaboration/heartbeat', ['module' => 'dashboard'])
            ->assertOk();
        $this->assertSame(['songs' => 1], $response->json('data.badges')); // own settings edit doesn't count
        $this->assertSame('seating', $response->json('data.presence.0.current_module'));

        $partnerView = $this->actingAs($partner, 'sanctum')
            ->postJson('/api/collaboration/heartbeat', ['module' => 'songs'])->assertOk();
        $this->assertSame(['settings' => 1], $partnerView->json('data.badges')); // songs: just opened
    }

    public function test_invite_and_accept_flow(): void
    {
        Mail::fake();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/collaborators/invite', ['name' => 'Planner', 'email' => 'planner@example.com'])
            ->assertCreated();
        Mail::assertSent(CollaboratorInvitation::class, fn ($mail) => $mail->hasTo('planner@example.com'));

        parse_str(parse_url($response->json('data.invite_link'), PHP_URL_QUERY), $query);

        $list = $this->actingAs($this->admin, 'sanctum')->getJson('/api/collaborators')->assertOk();
        $this->assertTrue(collect($list->json('data'))->firstWhere('email', 'planner@example.com')['pending']);

        $this->postJson('/api/collaborators/accept', [
            'email' => 'planner@example.com', 'token' => 'wrong', 'password' => 'secret123', 'password_confirmation' => 'secret123',
        ])->assertStatus(422);

        $this->postJson('/api/collaborators/accept', [
            'email' => 'planner@example.com', 'token' => $query['token'], 'password' => 'secret123', 'password_confirmation' => 'secret123',
        ])->assertOk()->assertJsonStructure(['data' => ['token', 'user']]);

        $this->postJson('/api/login', ['email' => 'planner@example.com', 'password' => 'secret123'])->assertOk();

        // The link only works once.
        $this->postJson('/api/collaborators/accept', [
            'email' => 'planner@example.com', 'token' => $query['token'], 'password' => 'another1', 'password_confirmation' => 'another1',
        ])->assertStatus(422);
    }

    public function test_cannot_invite_existing_member(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/collaborators/invite', ['name' => 'Me', 'email' => $this->admin->email])
            ->assertStatus(422);
    }

    public function test_collaboration_routes_require_auth(): void
    {
        $this->postJson('/api/collaboration/heartbeat')->assertUnauthorized();
        $this->getJson('/api/revisions')->assertUnauthorized();
        $this->postJson('/api/collaborators/invite')->assertUnauthorized();
    }
}
