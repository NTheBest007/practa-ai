-- Migration to handle usage tracking when users upgrade plans
-- This ensures existing call counts are preserved when upgrading from free to premium

-- Function to migrate scenario usage when user upgrades to premium
CREATE OR REPLACE FUNCTION migrate_usage_on_upgrade(
  p_user_id uuid,
  p_new_period_start timestamptz,
  p_new_period_end timestamptz
)
RETURNS void AS $$
BEGIN
  -- Update existing usage records to new billing period
  -- This preserves the sessions_count while updating the period dates
  UPDATE scenario_usage
  SET 
    period_start = p_new_period_start,
    period_end = p_new_period_end,
    updated_at = now()
  WHERE user_id = p_user_id
    AND period_start = '1970-01-01T00:00:00Z'::timestamptz -- Free plan epoch start
    AND period_end = '9999-12-31T23:59:59.999Z'::timestamptz; -- Free plan far future end
    
  -- If no existing records, nothing to migrate (user hasn't made any calls yet)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION migrate_usage_on_upgrade TO authenticated;
