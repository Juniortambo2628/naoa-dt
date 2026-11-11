<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Loads the couple's programme (Wayfarer Events, "Updated Wedding Programme")
 * into the schedule, so it shows on the Programme page and stays editable in
 * Admin → Schedule.
 *
 * Runs once. Whatever schedule existed before is saved to the
 * `programme_backup_before_import` setting (JSON) so nothing is lost, and live
 * updates are kept (only unlinked from the old items).
 */
return new class extends Migration
{
    private const MARKER = 'programme_imported_v1';

    private const VENUE = 'Zereneti Gardens';

    public function up(): void
    {
        if (DB::table('settings')->where('key', self::MARKER)->exists()) {
            return;
        }

        DB::transaction(function () {
            $now = now();

            $events = DB::table('events')->get();
            if ($events->isNotEmpty()) {
                $backup = $events->map(fn ($event) => [
                    'event' => (array) $event,
                    'items' => DB::table('schedule_items')->where('event_id', $event->id)->get()->map(fn ($i) => (array) $i)->all(),
                ])->all();
                $this->putSetting('programme_backup_before_import', json_encode($backup), 'schedule');

                DB::table('live_updates')->whereNotNull('schedule_item_id')->update(['schedule_item_id' => null]);
                DB::table('schedule_items')->delete();
                DB::table('events')->delete();
            }

            $eventId = DB::table('events')->insertGetId([
                'name' => 'Traditional Wedding Celebration',
                'event_date' => '2026-11-14',
                'event_time' => '10:00:00',
                'venue' => self::VENUE,
                'description' => 'A celebration of love, family, culture and the coming together of two families.',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            foreach ($this->items() as $order => [$title, $start, $end, $description, $location, $type]) {
                DB::table('schedule_items')->insert([
                    'event_id' => $eventId,
                    'title' => $title,
                    'start_time' => $start.':00',
                    'end_time' => $end ? $end.':00' : null,
                    'description' => $description,
                    'location' => $location,
                    'type' => $type,
                    'status' => 'upcoming',
                    'order' => $order + 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            $this->putSetting('programme_note', 'Timings are indicative and will be coordinated by the Wayfarer Events team. '
                .'Dowry negotiations will take place in the boardroom. Guest lunch (1:00–2:15 PM) runs alongside the '
                ."couple's photo session (1:20–2:30 PM); the couple will be served separately.", 'schedule');
            $this->putSetting('bridal_party', implode("\n", [
                'Anita', 'Edna', 'Phyllis', 'Oyemi', 'Ankita', 'Namz', 'Diane', 'Nia', 'Imelda', 'Nanette',
            ]), 'schedule');

            // The venue was still the starter placeholder: use the programme's.
            $venue = DB::table('settings')->where('key', 'venue_name')->value('value');
            if (blank($venue) || $venue === 'Rosewood Manor') {
                $this->putSetting('venue_name', self::VENUE, 'general');
            }

            // The programme now exists, so show the Programme page (it can be
            // switched off again in Admin → Modules).
            DB::table('page_contents')->updateOrInsert(
                ['section_key' => 'programme_page'],
                ['is_visible' => true, 'updated_at' => $now]
            );

            $this->putSetting(self::MARKER, $now->toDateTimeString(), 'schedule');
        });
    }

    public function down(): void
    {
        // Data import: the previous schedule is kept in the
        // programme_backup_before_import setting if it needs restoring.
    }

    /** [title, start, end, description, location, type] in programme order. */
    private function items(): array
    {
        $venue = self::VENUE;

        return [
            ['Bridal preparations', '06:00', null, 'Hair and makeup preparations begin for the bride and bridal party.', null, 'Default'],
            ['Breakfast', '08:00', '09:30', 'Breakfast hosted by Zereneti Gardens.', $venue, 'Reception'],
            ['Photography & content creation', '08:30', '09:30', 'Photo and video coverage begins, capturing bridal preparations, venue details, décor and behind-the-scenes content.', $venue, 'Photos'],
            ['Guest arrival', '10:00', '11:00', 'Guests are welcomed and received in the boardroom.', 'Boardroom', 'Default'],
            ['Dowry negotiations', '10:00', '11:00', 'Traditional family negotiations take place in the boardroom.', 'Boardroom', 'Ceremony'],
            ['Bridal party arrival', '11:00', '12:00', 'The bridal party arrives as preparations are made for the main traditional proceedings.', $venue, 'Default'],
            ['Blessing ceremony', '12:30', '13:00', 'A priest-led blessing ceremony.', $venue, 'Ceremony'],
            ['Décor reveal', '13:10', '13:20', 'The couple are welcomed into the tent for the décor reveal.', 'Main tent', 'Default'],
            ["Couple's photo session", '13:20', '14:30', 'The couple proceed for their photo session. Their lunch will be served separately during this time.', $venue, 'Photos'],
            ['Guest lunch', '13:00', '14:15', "Lunch served by Persis Caterers, with table-number service. This runs alongside the couple's photo session.", 'Main tent', 'Reception'],
            ['Entertainment', '14:15', '14:30', 'The MC entertains guests.', 'Main tent', 'Party'],
            ["Couple's arrival", '14:30', '15:30', 'The couple arrive and are received by guests in the main tent.', 'Main tent', 'Ceremony'],
            ['Speeches & family messages', '15:30', '16:15', 'Speeches, family messages and acknowledgements.', 'Main tent', 'Default'],
            ['Presentations by friends', '16:15', '17:00', 'Presentations and entertainment by friends.', 'Main tent', 'Party'],
            ['Cake cutting', '17:00', null, 'Cake presentation, cake cutting and photographs.', 'Main tent', 'Reception'],
            ['Gifting & afternoon tea', '17:30', '18:00', 'Gifting ceremony followed by afternoon tea.', 'Main tent', 'Cocktails'],
            ['Guest departure', '18:00', null, 'Guests may depart at their leisure.', null, 'Default'],
            ['Evening party', '20:00', '21:00', 'Guests are welcomed to the evening party venue.', 'Evening party venue', 'Party'],
            ['Evening dinner', '21:00', '22:00', 'Mbuzi dinner served by Zereneti Gardens.', 'Evening party venue', 'Reception'],
        ];
    }

    private function putSetting(string $key, string $value, string $group): void
    {
        $exists = DB::table('settings')->where('key', $key)->exists();
        $exists
            ? DB::table('settings')->where('key', $key)->update(['value' => $value, 'updated_at' => now()])
            : DB::table('settings')->insert(['key' => $key, 'value' => $value, 'group' => $group, 'created_at' => now(), 'updated_at' => now()]);
    }
};
