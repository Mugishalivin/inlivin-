alter table public.user_settings
add column if not exists theme_accent text not null default 'sunset';

alter table public.user_settings
add column if not exists feed_density text not null default 'comfortable';

alter table public.user_settings
add column if not exists push_notifications boolean not null default true;

alter table public.user_settings
add column if not exists sms_notifications boolean not null default false;

alter table public.user_settings
add column if not exists email_summary text not null default 'weekly';

alter table public.user_settings
add column if not exists message_sound boolean not null default true;

alter table public.user_settings
add column if not exists allow_group_invites boolean not null default true;

alter table public.user_settings
add column if not exists autoplay_gifs boolean not null default true;

alter table public.user_settings
add column if not exists high_quality_media boolean not null default true;

alter table public.user_settings
add column if not exists wifi_only_media boolean not null default false;

alter table public.user_settings
add column if not exists discoverable_profile boolean not null default true;

alter table public.user_settings
add column if not exists show_in_search boolean not null default true;

alter table public.user_settings
add column if not exists recommend_to_others boolean not null default true;

alter table public.user_settings
add column if not exists reduced_motion boolean not null default false;

alter table public.user_settings
add column if not exists large_text boolean not null default false;

alter table public.user_settings
add column if not exists captions_enabled boolean not null default true;

alter table public.user_settings
add column if not exists high_contrast_mode boolean not null default false;

alter table public.user_settings
add column if not exists two_factor_enabled boolean not null default false;

alter table public.user_settings
add column if not exists session_timeout_minutes integer not null default 60;

alter table public.user_settings
add column if not exists require_password_for_actions boolean not null default true;

alter table public.user_settings
add column if not exists data_sharing boolean not null default true;

alter table public.user_settings
add column if not exists analytics_sharing boolean not null default true;

alter table public.user_settings
add column if not exists backup_exports boolean not null default true;

alter table public.user_settings
add column if not exists instagram_sync boolean not null default false;

alter table public.user_settings
add column if not exists spotify_sync boolean not null default false;

alter table public.user_settings
add column if not exists calendar_sync boolean not null default false;

alter table public.user_settings
add column if not exists drive_sync boolean not null default false;

alter table public.user_settings
add column if not exists slack_sync boolean not null default false;

alter table public.user_settings
add column if not exists show_activity_status boolean not null default true;

alter table public.user_settings
add column if not exists typing_indicator boolean not null default true;

alter table public.user_settings
add column if not exists profile_highlights boolean not null default true;

alter table public.user_settings
add column if not exists beta_features boolean not null default false;

alter table public.user_settings
add column if not exists developer_mode boolean not null default false;

alter table public.user_settings
add column if not exists content_language text not null default 'English';

alter table public.user_settings
add column if not exists login_alerts boolean not null default true;

alter table public.user_settings
add column if not exists allow_follow_requests boolean not null default true;

alter table public.user_settings
add column if not exists allow_tagging boolean not null default true;

alter table public.user_settings
add column if not exists sidebar_mode text not null default 'auto';

alter table public.user_settings
add column if not exists auto_archive_days integer not null default 30;

alter table public.user_settings
add column if not exists auto_save_drafts boolean not null default true;
