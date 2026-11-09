-- CreateIndex
CREATE INDEX "ApiKey_app_id_idx" ON "ApiKey"("app_id");

-- CreateIndex
CREATE INDEX "ApiKey_app_id_is_active_expires_at_idx" ON "ApiKey"("app_id", "is_active", "expires_at");

-- CreateIndex
CREATE INDEX "App_owner_id_idx" ON "App"("owner_id");

-- CreateIndex
CREATE INDEX "Event_app_id_event_name_timestamp_idx" ON "Event"("app_id", "event_name", "timestamp");

-- CreateIndex
CREATE INDEX "Event_app_id_external_user_id_idx" ON "Event"("app_id", "external_user_id");
