alter table manyang.tarot_readings
  add column if not exists reading_key text not null default 'daily';

alter table manyang.tarot_readings
  drop constraint if exists tarot_readings_spread_check;

alter table manyang.tarot_readings
  add constraint tarot_readings_spread_check
  check (spread in ('daily_one_card', 'question_one_card', 'daily_three_card'));

alter table manyang.tarot_readings
  drop constraint if exists tarot_readings_user_id_app_date_spread_key;

alter table manyang.tarot_readings
  add constraint tarot_readings_user_date_spread_key_unique
  unique (user_id, app_date, spread, reading_key);

alter table manyang.reading_usage
  drop constraint if exists reading_usage_feature_key_check;

alter table manyang.reading_usage
  add constraint reading_usage_feature_key_check
  check (feature_key in ('dream_basic', 'dream_premium', 'tarot_one_card', 'tarot_question_one_card', 'tarot_three_card'));
