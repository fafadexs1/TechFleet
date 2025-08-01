# **App Name**: TechFleet

## Core Features:

- Dashboard View: Dashboard overview of vehicle status, technician assignments, and recent activity.
- Maintenance Log: Log vehicle maintenance (data_ultima_manutencao, data_proxima_manutencao, quilometragem) with photo uploads (foto_carro).
- Expense Tracking: Record fuel expenses and other vehicle-related payments (public.pagamentos) , with receipt uploads.
- Daily Schedule: Display the schedule, pulled from the supabase table 'registros', showing entries between inicio_expediente and final_expediente.
- App Version Control: Displays the fields from 'atualiza_app' to indicate the current status of the application used by field technicians. The fields 'apkUrl', 'apkFileName', 'packageName', and 'appversion' indicate the current available version.
- Supabase Integration: Integrate with Supabase (using environment variables for keys) to manage vehicle data and technician info.

## Style Guidelines:

- Primary color: Deep blue (#32628A), evoking trust and reliability suitable for enterprise apps.
- Background color: Light gray (#E8EBEF), provides a clean, modern backdrop to focus user attention.
- Accent color: Yellow-orange (#DFA444) is analogous to the primary, and good for highlights and calls to action; it communicates energy.
- Body font: 'Inter' (sans-serif) is a neutral, modern font that works well for displaying data and long text.
- Headline font: 'Space Grotesk' (sans-serif), for headlines and short amounts of body text
- Use a consistent set of icons, with a simple and geometric style, to represent vehicles, maintenance, payments, and technicians.
- Implement a card-based layout with clear sections for data display.