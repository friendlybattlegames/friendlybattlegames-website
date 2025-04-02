-- Create a function to get top players by total score
create or replace function get_top_players(limit_count integer)
returns table (
    user_id uuid,
    username text,
    avatar_url text,
    total_score bigint
)
language plpgsql
security definer
as $$
begin
    return query
    select 
        p.id as user_id,
        p.username,
        p.avatar_url,
        coalesce(sum(gs.score), 0)::bigint as total_score
    from profiles p
    left join game_scores gs on p.id = gs.user_id
    group by p.id, p.username, p.avatar_url
    order by total_score desc
    limit limit_count;
end;
$$;
