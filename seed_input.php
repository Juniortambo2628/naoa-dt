
try {
    $user = \App\Models\User::where('email', 'admin@wedding.com')->first();
    if (!$user) {
        $user = \App\Models\User::create([
            'name' => 'Admin',
            'email' => 'admin@wedding.com',
            'password' => bcrypt('password')
        ]);
        echo "User created successfully with ID: " . $user->id . "\n";
    } else {
        echo "User already exists with ID: " . $user->id . "\n";
    }
} catch (\Exception $e) {
    echo "Error creating user: " . $e->getMessage() . "\n";
}
