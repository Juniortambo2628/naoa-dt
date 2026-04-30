<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Dinah & Tze Ren Wedding')</title>
    <style>
        /* Base Styles */
        body {
            font-family: 'Georgia', serif;
            line-height: 1.6;
            color: #4A3F35;
            background-color: #FDFBFA;
            margin: 0;
            padding: 0;
        }
        .wrapper {
            width: 100%;
            table-layout: fixed;
            background-color: #FDFBFA;
            padding: 40px 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(166, 123, 91, 0.08);
            border: 1px solid rgba(166, 123, 91, 0.1);
        }
        
        /* Typography */
        h1, h2, h3 {
            font-family: 'Georgia', serif;
            font-weight: normal;
            margin: 0 0 20px;
            color: #4A3F35;
        }
        p {
            margin: 0 0 20px;
        }
        
        /* Components */
        .header {
            padding: 50px 40px;
            text-align: center;
            background-color: #ffffff;
        }
        .names {
            font-size: 32px;
            color: #A67B5B;
            letter-spacing: 2px;
            margin-bottom: 5px;
        }
        .ornament {
            font-size: 24px;
            color: #D4A59A;
            margin: 10px 0;
        }
        .date-line {
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 3px;
            color: #8C8279;
        }
        
        .content {
            padding: 0 50px 50px;
            text-align: center;
        }
        
        .button-wrapper {
            margin: 40px 0;
        }
        .button {
            display: inline-block;
            background-color: #A67B5B;
            color: #ffffff !important;
            padding: 16px 40px;
            text-decoration: none;
            border-radius: 50px;
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            box-shadow: 0 4px 15px rgba(166, 123, 91, 0.2);
        }
        
        .footer {
            background-color: #FAF8F6;
            padding: 40px;
            text-align: center;
            font-size: 12px;
            color: #B2A69B;
            border-top: 1px solid #F0ECE9;
        }
        .footer-logo {
            font-size: 18px;
            color: #A67B5B;
            margin-bottom: 20px;
        }
        
        /* Mobile Overrides */
        @media only screen and (max-width: 600px) {
            .container {
                width: 90% !important;
                border-radius: 15px !important;
            }
            .content {
                padding: 0 30px 40px !important;
            }
            .header {
                padding: 40px 30px !important;
            }
            .names {
                font-size: 28px !important;
            }
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <div class="names">Dinah & Tze Ren</div>
                <div class="ornament">❧</div>
                @php
                    $countdown = \App\Models\PageContent::where('section_key', 'countdown')->first();
                    $dateRaw = $countdown->content['wedding_date'] ?? '2026-11-14';
                    $formattedDate = \Carbon\Carbon::parse($dateRaw)->format('F jS, Y');
                    
                    $homeHero = \App\Models\PageContent::where('section_key', 'home_hero')->first();
                    $location = $homeHero->content['location'] ?? 'Nairobi, Kenya';
                    if (is_array($location)) {
                        $location = $location['en'] ?? array_values($location)[0];
                    }
                @endphp
                <div class="date-line">{{ $formattedDate }} • {{ $location }}</div>
            </div>
            
            <div class="content">
                @yield('content')
            </div>
            
            <div class="footer">
                <div class="footer-logo">D & T</div>
                <p>We are so happy to share this journey with you.</p>
                <p style="margin-bottom: 0;">
                    Questions? Reply to this email or visit our <a href="{{ config('app.frontend_url') }}" style="color: #A67B5B; text-decoration: none;">wedding website</a>.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
