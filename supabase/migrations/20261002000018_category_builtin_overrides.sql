-- A built-in category the user renamed or recolored. The built-ins live in the app's code;
-- a row with `builtin` set (their key: 'groceries', 'rent'...) holds the user's name and
-- color for it, on top of the app's. Null for the categories the user made.
-- No unique (user_id, builtin): two devices customizing the same one offline would make two
-- rows, and the second could never sync. The app takes the latest one instead.
alter table public.categories add column builtin text;
