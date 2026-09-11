# Swiss Dev Supabase setup

1. Open the Supabase dashboard for the project.
2. Open **SQL Editor** and create a new query.
3. Open `supabase/migrations/001_initial_schema.sql` in VS Code, copy its entire contents, and paste the SQL itself into the editor. Do not paste the local file path as a query.
4. Click **Run**.
5. Enable the authentication providers required by the app under **Authentication > Providers**.
6. Keep the publishable key in `.env.local`; never use a service-role key in browser code.

The migration creates:

- `profiles` and `subscriptions` for accounts and plan state
- `workspaces` and `workspace_files` for projects
- `agents` for agent configuration
- `custom_domains` for publishing domains
- `daily_usage` for runtime and AI quota tracking
- `plan_comments` and `visual_comments` for review workflows

Every user-owned table has Row Level Security enabled. The auth trigger creates a Free profile and subscription automatically for new Supabase Auth users.
