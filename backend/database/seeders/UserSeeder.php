<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    /**
     * Seed demo users: admin, student, and staff.
     */
    public function run(): void
    {
        // ── Admin ───────────────────────────────────────────
        User::updateOrCreate(
            ['email' => 'admin@gsu.ac.zw'],
            [
                'name'                 => 'System Administrator',
                'password'             => bcrypt('Admin@123'),
                'role'                 => 'admin',
                'date_of_birth'        => '1985-06-15',
                'national_id'          => '63-100000A00',
                'security_code'        => strtoupper(Str::random(8)),
                'onboarding_completed' => true,
                'email_verified_at'    => now(),
                'last_login_at'        => now(),
            ]
        );

        // ── Student ─────────────────────────────────────────
        User::updateOrCreate(
            ['email' => 'student@gsu.ac.zw'],
            [
                'name'                 => 'Jane Moyo',
                'password'             => bcrypt('Student@123'),
                'role'                 => 'student',
                'date_of_birth'        => '2002-03-22',
                'national_id'          => '63-200000B01',
                'security_code'        => strtoupper(Str::random(8)),
                'onboarding_completed' => true,
                'email_verified_at'    => now(),
                'last_login_at'        => now(),
            ]
        );

        // ── Staff ───────────────────────────────────────────
        User::updateOrCreate(
            ['email' => 'staff@gsu.ac.zw'],
            [
                'name'                 => 'Dr. Tendai Nyathi',
                'password'             => bcrypt('Staff@123'),
                'role'                 => 'staff',
                'date_of_birth'        => '1978-11-08',
                'national_id'          => '63-300000C02',
                'security_code'        => strtoupper(Str::random(8)),
                'onboarding_completed' => true,
                'email_verified_at'    => now(),
                'last_login_at'        => now(),
            ]
        );

        $this->command->info('Seeded 3 users: admin@gsu.ac.zw / student@gsu.ac.zw / staff@gsu.ac.zw');
    }
}
