<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Save the Date - Add to Calendar</title>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Lato:wght@300;400;700&family=Great+Vibes&display=swap" rel="stylesheet">
    <style>
        :root {
            --accent: #A67B5B;
            --bg: #FDFCFB;
            --text: #4A3F35;
        }
        body {
            margin: 0;
            padding: 0;
            background-color: var(--bg);
            color: var(--text);
            font-family: 'Lato', sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            text-align: center;
        }
        .card {
            background: white;
            padding: 3rem 2rem;
            border-radius: 2rem;
            box-shadow: 0 20px 40px rgba(166, 123, 91, 0.08);
            max-width: 400px;
            width: 90%;
            border: 1px solid rgba(166, 123, 91, 0.1);
        }
        .ornament {
            font-family: 'Great Vibes', cursive;
            font-size: 2.5rem;
            color: var(--accent);
            margin-bottom: 1rem;
            opacity: 0.8;
        }
        h1 {
            font-family: 'Cormorant Garamond', serif;
            font-size: 1.8rem;
            margin-bottom: 0.5rem;
            font-weight: 600;
        }
        p {
            font-size: 0.9rem;
            color: #8C8279;
            margin-bottom: 2rem;
            line-height: 1.6;
            padding: 0 1rem;
        }
        .buttons {
            display: flex;
            flex-direction: column;
            gap: 0.8rem;
        }
        .btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.8rem;
            padding: 1rem;
            border-radius: 1rem;
            text-decoration: none;
            font-size: 0.9rem;
            font-weight: 600;
            transition: all 0.3s ease;
            border: 1px solid #E5E1DD;
        }
        .btn-google {
            background: #fff;
            color: #4285F4;
            border-color: #4285F4;
        }
        .btn-google:hover {
            background: #4285F4;
            color: white;
            box-shadow: 0 4px 12px rgba(66, 133, 244, 0.2);
        }
        .btn-outlook {
            background: #fff;
            color: #0078D4;
            border-color: #0078D4;
        }
        .btn-outlook:hover {
            background: #0078D4;
            color: white;
            box-shadow: 0 4px 12px rgba(0, 120, 212, 0.2);
        }
        .btn-apple {
            background: var(--text);
            color: white;
            border: none;
        }
        .btn-apple:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 16px rgba(74, 63, 53, 0.15);
        }
        .footer {
            margin-top: 2rem;
            font-size: 0.75rem;
            color: #B2A69B;
            letter-spacing: 0.05em;
            text-transform: uppercase;
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="ornament">Save the Date</div>
        <h1>{{ $title }}</h1>
        <p>Choose your calendar service to add the wedding event.</p>
        
        <div class="buttons">
            <a href="{{ $googleUrl }}" class="btn btn-google" target="_blank">
                Google Calendar
            </a>
            <a href="{{ $outlookUrl }}" class="btn btn-outlook" target="_blank">
                Outlook / Office 365
            </a>
            <a href="{{ $icsUrl }}" class="btn btn-apple">
                Apple / Other (ICS)
            </a>
        </div>

        <div class="footer">
            Dinah & Tze Ren Wedding
        </div>
    </div>
</body>
</html>
