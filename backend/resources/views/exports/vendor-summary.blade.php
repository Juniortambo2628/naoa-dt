<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    <style>
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #A67B5B;
        }
        .header h1 {
            color: #A67B5B;
            margin: 0;
            font-size: 24px;
        }
        .header p {
            color: #666;
            margin: 5px 0 0;
        }
        .summary {
            margin-bottom: 30px;
            padding: 15px;
            background: #f9f5f2;
            border-radius: 5px;
        }
        .summary-grid {
            display: table;
            width: 100%;
        }
        .summary-item {
            display: table-cell;
            text-align: center;
            padding: 10px;
        }
        .summary-value {
            font-size: 28px;
            font-weight: bold;
            color: #A67B5B;
        }
        .summary-label {
            font-size: 11px;
            color: #666;
            text-transform: uppercase;
        }
        .dietary-section {
            margin-bottom: 30px;
        }
        .dietary-section h3 {
            color: #4A3F35;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background: #A67B5B;
            color: white;
        }
        tr:nth-child(even) {
            background: #f9f9f9;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #999;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $title }}</h1>
        <p>Generated on {{ $date }}</p>
    </div>

    <div class="summary">
        <div class="summary-grid">
            <div class="summary-item">
                <div class="summary-value">{{ $totalConfirmed }}</div>
                <div class="summary-label">Confirmed Entries</div>
            </div>
            <div class="summary-item">
                <div class="summary-value">{{ $totalAttendees }}</div>
                <div class="summary-label">Total Headcount</div>
            </div>
        </div>
    </div>

    <div class="dietary-section">
        <h3>Dietary Requirements Summary</h3>
        <table>
            <tr>
                <th>Requirement</th>
                <th>Count</th>
            </tr>
            @forelse($dietaryBreakdown as $diet => $count)
            <tr>
                <td>{{ $diet ?: 'None/Standard' }}</td>
                <td>{{ $count }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="2">No special requirements noted.</td>
            </tr>
            @endforelse
        </table>
    </div>

    <h3>Guest List</h3>
    <table>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Dietary Notes</th>
            <th>Table</th>
        </tr>
        @foreach($guests as $guest)
        <tr>
            <td>{{ $guest['name'] }}</td>
            <td>{{ $guest['is_plus_one'] ? 'Plus One' : 'Primary Guest' }}</td>
            <td>{{ $guest['dietary'] }}</td>
            <td>{{ $guest['table'] }}</td>
        </tr>
        @endforeach
    </table>

    <div class="footer">
        <p>This document is confidential and intended for vendor use only.</p>
    </div>
</body>
</html>
