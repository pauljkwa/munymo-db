import {
  AdminBatchNotificationData,
  AdminBatchNotificationError,
  AdminFixSubscriptionData,
  AdminFixSubscriptionError,
  AdminFixSubscriptionParams,
  AdminNotificationRequest,
  AdminRoleRequest,
  AdminSendNotificationData,
  AdminSendNotificationError,
  AppApisTestRunnerCliTestRunRequest,
  AppApisTestRunnerTestRunRequest,
  AssignAdminRole2Data,
  AssignAdminRole2Error,
  AssignAdminRole2Params,
  AssignAdminRoleData,
  AssignAdminRoleError,
  AssignAdminRoleParams,
  BatchNotificationRequest,
  BetaSignupRequest,
  BodyUploadGameDataCsv,
  CheckHealthData,
  CleanupSandboxTestDataData,
  CleanupSandboxTestDataError,
  CleanupSandboxTestDataParams,
  ClearSchedulerErrorsData,
  ClearSchedulerErrorsError,
  CoverageReportRequest,
  CreateBetaSignupData,
  CreateBetaSignupError,
  CreateCheckoutSessionData,
  CreateCheckoutSessionError,
  CreateCheckoutSessionRequest,
  CreateGameData,
  CreateGameError,
  CreateGameSubmissionData,
  CreateGameSubmissionError,
  CreateTestCaseData,
  CreateTestCaseError,
  CreateTestExecutionPlanData,
  CreateTestExecutionPlanError,
  CreateTestUserData,
  CreateTestUserError,
  DeleteGameData,
  DeleteGameError,
  DeleteGameParams,
  DeleteTestCaseData,
  DeleteTestCaseError,
  DeleteTestCaseParams,
  DeleteTestRunData,
  DeleteTestRunError,
  DeleteTestRunParams,
  DisableCronData,
  DisableCronError,
  DisableSchedulerData,
  DisableSchedulerError,
  DiscoverCompaniesEndpointData,
  DiscoverCompaniesEndpointError,
  DiscoverCompaniesEndpointParams,
  EnableCronData,
  EnableCronError,
  EnableSchedulerData,
  EnableSchedulerError,
  FcmTokenRequest,
  FinalizeGameResultsData,
  FinalizeGameResultsError,
  FinalizeGameResultsParams,
  GameCreateRequest,
  GameGenerationRequest,
  GameUpdateRequest,
  GenerateCompanyPairEndpointData,
  GenerateCompanyPairEndpointError,
  GenerateCompanyPairEndpointParams,
  GenerateCoverageReportData,
  GenerateCoverageReportError,
  GenerateGameEndpointData,
  GenerateGameEndpointError,
  GenerateMockGameEndpointData,
  GenerateMockGameEndpointError,
  GenerateMockGameEndpointParams,
  GenerateTestReportData,
  GenerateUpcomingGamesEndpointData,
  GenerateUpcomingGamesEndpointError,
  GenerateUpcomingGamesEndpointParams,
  GetAllTestCasesData,
  GetAuthBypassExampleData,
  GetAuthHeadersData,
  GetComponentsData,
  GetComprehensiveE2ETestPlan2Data,
  GetComprehensiveE2ETestPlanData,
  GetCoverageReportData,
  GetCoverageReportError,
  GetCoverageReportParams,
  GetCoverageSummaryData,
  GetCronStatusData,
  GetCronStatusError,
  GetDailyPredictionPairData,
  GetDatabaseTestPlanData,
  GetDetailedDatabaseTestPlanData,
  GetDetailedPaymentTestPlanData,
  GetDevelopmentRulesData,
  GetDeviceAnalyticsData,
  GetDeviceAnalyticsError,
  GetDocumentation2Data,
  GetDocumentation2Error,
  GetEnvironmentSetupGuideData,
  GetExchangeCalendarEndpointData,
  GetExchangeCalendarEndpointError,
  GetExchangeCalendarEndpointParams,
  GetExtensionGuideData,
  GetFeaturesForComponentData,
  GetFeaturesForComponentError,
  GetFeaturesForComponentParams,
  GetFinancialDataData,
  GetFinancialDataError,
  GetFinancialDataParams,
  GetGameData,
  GetGameError,
  GetGameParams,
  GetLatestCoverageData,
  GetLeaderboardData,
  GetLeaderboardError,
  GetLeaderboardParams,
  GetMapSummaryData,
  GetMigrationDocs22Data,
  GetMigrationDocs2Data,
  GetMigrationDocsData,
  GetMigrationDocsError,
  GetMissingFeaturesData,
  GetMunyiqScoreData,
  GetMunyiqScoreError,
  GetMunyiqScoreParams,
  GetMunyiqStatsData,
  GetMunyiqStatsError,
  GetNextGameClueData,
  GetNextTradingDayEndpointData,
  GetNextTradingDayEndpointError,
  GetNextTradingDayEndpointParams,
  GetPaymentTestPlanData,
  GetProductionChecklistData,
  GetSandboxStatusData,
  GetSandboxStatusError,
  GetSchedulerErrorsData,
  GetSchedulerErrorsError,
  GetSchedulerStatusData,
  GetSchedulerStatusError,
  GetStripeTestConfigData,
  GetSubscriptionDocumentationData,
  GetTechnicalConstraintsData,
  GetTestAuthTokenData,
  GetTestAuthTokenError,
  GetTestCaseData,
  GetTestCaseError,
  GetTestCaseParams,
  GetTestCoverageData,
  GetTestDocumentationData,
  GetTestFrameworkDocumentationData,
  GetTestModeData,
  GetTestPlanData,
  GetTestReportData,
  GetTestResultsData,
  GetTestResultsError,
  GetTestResultsParams,
  GetTestRunResultsData,
  GetTestRunResultsError,
  GetTestRunResultsParams,
  GetTestRunStatusData,
  GetTestRunStatusError,
  GetTestRunStatusParams,
  GetTestStatusData,
  GetTestStatusError,
  GetTestStatusParams,
  GetTestsForFeatureData,
  GetTestsForFeatureError,
  GetTestsForFeatureParams,
  GetTroubleshootingGuide2Data,
  GetTroubleshootingGuideData,
  GetTroubleshootingItem2Data,
  GetTroubleshootingItem2Error,
  GetTroubleshootingItem2Params,
  GetTroubleshootingItemData,
  GetTroubleshootingItemError,
  GetTroubleshootingItemParams,
  HealthCheckData,
  InitializeSchedulerEndpointData,
  InitializeSchedulerEndpointError,
  ListAdminRoles2Data,
  ListAdminRoles2Error,
  ListAdminRolesData,
  ListAdminRolesError,
  ListGameSubmissionsData,
  ListGameSubmissionsError,
  ListGameSubmissionsParams,
  ListGamesData,
  ListGamesError,
  ListGamesParams,
  ListTestRunsData,
  ListTestRunsError,
  ListTestRunsParams,
  ListUsersData,
  ListUsersError,
  ListUsersParams,
  MarkFeatureCoveredData,
  MarkFeatureCoveredError,
  MarkFeatureCoveredParams,
  MigrateCompanyCacheToSupabaseData,
  MigrateCompanyCacheToSupabaseError,
  MigrateCoverageReportsData,
  MigrateCoverageReportsEndpointData,
  MigrateCronToSupabase2Data,
  MigrateCronToSupabase2Error,
  MigrateCronToSupabaseData,
  MigrateCronToSupabaseError,
  MigrateRoles2Data,
  MigrateRoles2Error,
  MigrateRolesData,
  MigrateRolesError,
  MigrateSandboxSettingsData,
  MigrateSandboxSettingsError,
  MigrateSchedulerErrorsToSupabaseData,
  MigrateSchedulerErrorsToSupabaseError,
  MigrateSchedulerToSupabase2Data,
  MigrateSchedulerToSupabase2Error,
  MigrateSchedulerToSupabaseData,
  MigrateSchedulerToSupabaseError,
  MigrateTestResultsData,
  MigrateTestResultsEndpointData,
  MigrateTestStorageTablesData,
  MigrateTestStorageTablesEndpointData,
  MigrateValidationResultsData,
  MigrateValidationResultsEndpointData,
  NotificationEventRequest,
  NotificationRequest,
  PredictionRequest,
  ProcessGameResultsData,
  ProcessGameResultsError,
  ProcessResultsRequest,
  RecalculateMunyiqScoresData,
  RecalculateMunyiqScoresError,
  RecalculateMunyiqScoresParams,
  RecordTestResultsData,
  RecordTestResultsError,
  RegisterDeviceFcmTokenData,
  RegisterDeviceFcmTokenError,
  RemoveAdminRole2Data,
  RemoveAdminRole2Error,
  RemoveAdminRole2Params,
  RemoveAdminRoleData,
  RemoveAdminRoleError,
  RemoveAdminRoleParams,
  RunAllTasksData,
  RunAllTasksError,
  RunCronNowData,
  RunCronNowError,
  RunTaskData,
  RunTaskError,
  RunTaskParams,
  RunTestsData,
  RunTestsError,
  SendNotificationData,
  SendNotificationError,
  SetCronIntervalData,
  SetCronIntervalError,
  SetCronIntervalParams,
  SetGameRequest,
  SetSandboxGameData,
  SetSandboxGameError,
  SetupTestEnvironmentData,
  SetupTestEnvironmentError,
  SimulateCheckoutData,
  SimulateCheckoutError,
  SimulateCheckoutRequest,
  SimulateSubscriptionEventData,
  SimulateSubscriptionEventError,
  StartTestRunData,
  StartTestRunError,
  StripeWebhookData,
  StripeWebhookError,
  SubmissionCreateRequest,
  SubmissionUpdateRequest,
  SubmitPredictionData,
  SubmitPredictionError,
  TestAiReasoningData,
  TestAuthRequest,
  TestCaseInput,
  TestCompanyDiscoveryData,
  TestEdgeCasesData,
  TestEdgeCasesError,
  TestEvent,
  TestExecutionPlan,
  TestFullSchedulerCycleData,
  TestFullSchedulerCycleError,
  TestFullSchedulerCycleParams,
  TestGenerateGamesData,
  TestGenerateGamesError,
  TestGenerateGamesParams,
  TestMigrateCompanyCacheToSupabaseData,
  TestMultiDeviceData,
  TestMultiDeviceError,
  TestMultiDeviceRequest,
  TestNotificationData,
  TestNotificationDeliveryData,
  TestNotificationDeliveryError,
  TestNotificationError,
  TestNotificationRequest,
  TestProcessResultsData,
  TestProcessResultsError,
  TestProcessResultsParams,
  TestResults,
  TestSetupRequest,
  TestSignupData,
  TestSignupError,
  TestSignupRequest,
  TestUpdateClueData,
  TestUpdateClueError,
  TestUpdateClueParams,
  TestUserRequest,
  TestValidationRequest,
  ToggleSandboxModeData,
  ToggleSandboxModeError,
  ToggleTaskActive2Data,
  ToggleTaskActive2Error,
  ToggleTaskActiveData,
  ToggleTaskActiveError,
  ToggleTaskRequest,
  TrackNotificationEventData,
  TrackNotificationEventError,
  TriggerClosePredictionsData,
  TriggerClosePredictionsError,
  TriggerCronData,
  TriggerCronError,
  TriggerCronParams,
  TriggerLeaderboardUpdateData,
  TriggerLeaderboardUpdateError,
  TriggerProcessResultsData,
  TriggerProcessResultsError,
  TriggerScheduledTasksCheckData,
  UpdateGameData,
  UpdateGameError,
  UpdateGameParams,
  UpdateGameSubmissionData,
  UpdateGameSubmissionError,
  UpdateGameSubmissionParams,
  UpdateTestCaseData,
  UpdateTestCaseError,
  UpdateTestCaseParams,
  UpdateUserStatusData,
  UpdateUserStatusError,
  UpdateUserStatusParams,
  UploadGameDataCsvData,
  UploadGameDataCsvError,
  UserStatusUpdateRequest,
  ValidateComponentsData,
  ValidateComponentsError,
  ValidateComponentsPayload,
  ValidateFixes2Data,
  ValidateFixes2Error,
  ValidateFixesData,
  ValidateFixesError,
  ValidateFixesPayload,
  VerifyTestTokenData,
} from "./data-contracts";
import { ContentType, HttpClient, RequestParams } from "./http-client";

export class Brain<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /**
   * @description Check health of application. Returns 200 when OK, 500 when not.
   *
   * @name check_health
   * @summary Check Health
   * @request GET:/_healthz
   */
  check_health = (params: RequestParams = {}) =>
    this.request<CheckHealthData, any>({
      path: `/_healthz`,
      method: "GET",
      ...params,
    });

  /**
   * @description Retrieves the ranked leaderboard for a specific exchange based on accuracy, speed, and streak.
   *
   * @tags dbtn/module:leaderboard_api
   * @name get_leaderboard
   * @summary Get Leaderboard
   * @request GET:/routes/leaderboard/{exchange}
   */
  get_leaderboard = ({ exchange, ...query }: GetLeaderboardParams, params: RequestParams = {}) =>
    this.request<GetLeaderboardData, GetLeaderboardError>({
      path: `/routes/leaderboard/${exchange}`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Processes the results for a given prediction pair. 1. Fetches pair details (tickers, date) from storage. 2. Fetches user predictions for the pair from storage. 3. Fetches actual stock performance data from Finnhub for the relevant date. 4. Determines the winning stock based on performance. 5. Compares user predictions against the actual winner. 6. Stores the results (winner, performance, user scores). 7. (Later) Triggers notifications.
   *
   * @tags Results, dbtn/module:results_api
   * @name finalize_game_results
   * @summary Finalize Game Results
   * @request POST:/routes/results/process/{pair_id}
   */
  finalize_game_results = ({ pairId, ...query }: FinalizeGameResultsParams, params: RequestParams = {}) =>
    this.request<FinalizeGameResultsData, FinalizeGameResultsError>({
      path: `/routes/results/process/${pairId}`,
      method: "POST",
      ...params,
    });

  /**
   * @description Get comprehensive device analytics
   *
   * @tags Analytics, dbtn/module:analytics
   * @name get_device_analytics
   * @summary Get Device Analytics
   * @request GET:/routes/analytics/devices
   */
  get_device_analytics = (params: RequestParams = {}) =>
    this.request<GetDeviceAnalyticsData, GetDeviceAnalyticsError>({
      path: `/routes/analytics/devices`,
      method: "GET",
      ...params,
    });

  /**
   * @description Track notification delivery and interaction events
   *
   * @tags Analytics, dbtn/module:analytics
   * @name track_notification_event
   * @summary Track Notification Event
   * @request POST:/routes/analytics/notification-events
   */
  track_notification_event = (data: NotificationEventRequest, params: RequestParams = {}) =>
    this.request<TrackNotificationEventData, TrackNotificationEventError>({
      path: `/routes/analytics/notification-events`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get detailed financial metrics and historical data for a stock
   *
   * @tags dbtn/module:stock_data
   * @name get_financial_data
   * @summary Get Financial Data
   * @request GET:/routes/stock/financial-data/{ticker}
   */
  get_financial_data = ({ ticker, ...query }: GetFinancialDataParams, params: RequestParams = {}) =>
    this.request<GetFinancialDataData, GetFinancialDataError>({
      path: `/routes/stock/financial-data/${ticker}`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Generate a new game with AI reasoning for a specific date
   *
   * @tags dbtn/module:game_generation
   * @name generate_game_endpoint
   * @summary Generate Game Endpoint
   * @request POST:/routes/game/generate
   */
  generate_game_endpoint = (data: GameGenerationRequest, params: RequestParams = {}) =>
    this.request<GenerateGameEndpointData, GenerateGameEndpointError>({
      path: `/routes/game/generate`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Generate games for upcoming trading days
   *
   * @tags dbtn/module:game_generation
   * @name generate_upcoming_games_endpoint
   * @summary Generate Upcoming Games Endpoint
   * @request POST:/routes/games/generate-upcoming
   */
  generate_upcoming_games_endpoint = (query: GenerateUpcomingGamesEndpointParams, params: RequestParams = {}) =>
    this.request<GenerateUpcomingGamesEndpointData, GenerateUpcomingGamesEndpointError>({
      path: `/routes/games/generate-upcoming`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Generate a mock game for testing
   *
   * @tags dbtn/module:game_generation
   * @name generate_mock_game_endpoint
   * @summary Generate Mock Game Endpoint
   * @request GET:/routes/mock/game
   */
  generate_mock_game_endpoint = (query: GenerateMockGameEndpointParams, params: RequestParams = {}) =>
    this.request<GenerateMockGameEndpointData, GenerateMockGameEndpointError>({
      path: `/routes/mock/game`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Test endpoint for the AI reasoning generation
   *
   * @tags dbtn/module:game_generation
   * @name test_ai_reasoning
   * @summary Test Ai Reasoning
   * @request GET:/routes/test/ai-reasoning
   */
  test_ai_reasoning = (params: RequestParams = {}) =>
    this.request<TestAiReasoningData, any>({
      path: `/routes/test/ai-reasoning`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get MunyIQ score for the authenticated user or a specific user (admin only). Premium subscription required.
   *
   * @tags dbtn/module:munyiq_api
   * @name get_munyiq_score
   * @summary Get Munyiq Score
   * @request GET:/routes/munyiq/score
   */
  get_munyiq_score = (query: GetMunyiqScoreParams, params: RequestParams = {}) =>
    this.request<GetMunyiqScoreData, GetMunyiqScoreError>({
      path: `/routes/munyiq/score`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get statistical information about MunyIQ scores across all users. Returns percentile ranking and distribution data. Premium subscription required.
   *
   * @tags dbtn/module:munyiq_api
   * @name get_munyiq_stats
   * @summary Get Munyiq Stats
   * @request GET:/routes/munyiq/stats
   */
  get_munyiq_stats = (params: RequestParams = {}) =>
    this.request<GetMunyiqStatsData, GetMunyiqStatsError>({
      path: `/routes/munyiq/stats`,
      method: "GET",
      ...params,
    });

  /**
   * @description Admin endpoint to recalculate MunyIQ scores for all premium users
   *
   * @tags dbtn/module:munyiq_api
   * @name recalculate_munyiq_scores
   * @summary Recalculate Munyiq Scores
   * @request POST:/routes/munyiq/recalculate
   */
  recalculate_munyiq_scores = (query: RecalculateMunyiqScoresParams, params: RequestParams = {}) =>
    this.request<RecalculateMunyiqScoresData, RecalculateMunyiqScoresError>({
      path: `/routes/munyiq/recalculate`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Retrieve the end-to-end test report with findings and recommendations.
   *
   * @tags Testing, dbtn/module:test_report
   * @name get_test_report
   * @summary Get Test Report
   * @request GET:/routes/test-report/
   */
  get_test_report = (params: RequestParams = {}) =>
    this.request<GetTestReportData, any>({
      path: `/routes/test-report/`,
      method: "GET",
      ...params,
    });

  /**
   * @description Generate a test authentication token for testing purposes This endpoint is only available in development mode and should never be exposed in production. It generates a valid JWT token that can be used for testing endpoints that require authentication.
   *
   * @tags Testing, dbtn/module:test_auth
   * @name get_test_auth_token
   * @summary Get Test Auth Token
   * @request POST:/routes/test-auth/token
   */
  get_test_auth_token = (data: TestAuthRequest, params: RequestParams = {}) =>
    this.request<GetTestAuthTokenData, GetTestAuthTokenError>({
      path: `/routes/test-auth/token`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Verify a test token from Authorization header This endpoint can be used to verify if a test token is valid and will be accepted by the authentication system. Useful for debugging auth issues.
   *
   * @tags Testing, dbtn/module:test_auth
   * @name verify_test_token
   * @summary Verify Test Token
   * @request GET:/routes/test-auth/verify
   */
  verify_test_token = (params: RequestParams = {}) =>
    this.request<VerifyTestTokenData, any>({
      path: `/routes/test-auth/verify`,
      method: "GET",
      ...params,
    });

  /**
   * @description Retrieve the comprehensive testing plan
   *
   * @tags Testing, dbtn/module:test_plan
   * @name get_test_plan
   * @summary Get Test Plan
   * @request GET:/routes/test-plan/
   */
  get_test_plan = (params: RequestParams = {}) =>
    this.request<GetTestPlanData, any>({
      path: `/routes/test-plan/`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get the specific database integration test plan
   *
   * @tags Testing, dbtn/module:test_plan
   * @name get_database_test_plan
   * @summary Get Database Test Plan
   * @request GET:/routes/test-plan/database
   */
  get_database_test_plan = (params: RequestParams = {}) =>
    this.request<GetDatabaseTestPlanData, any>({
      path: `/routes/test-plan/database`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get the specific payment processing test plan
   *
   * @tags Testing, dbtn/module:test_plan
   * @name get_payment_test_plan
   * @summary Get Payment Test Plan
   * @request GET:/routes/test-plan/payment
   */
  get_payment_test_plan = (params: RequestParams = {}) =>
    this.request<GetPaymentTestPlanData, any>({
      path: `/routes/test-plan/payment`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get a comprehensive payment processing test plan with specific payment-focused tests
   *
   * @tags Testing, dbtn/module:test_plan
   * @name get_detailed_payment_test_plan
   * @summary Get Detailed Payment Test Plan
   * @request GET:/routes/test-plan/payment-detailed
   */
  get_detailed_payment_test_plan = (params: RequestParams = {}) =>
    this.request<GetDetailedPaymentTestPlanData, any>({
      path: `/routes/test-plan/payment-detailed`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get a comprehensive database integration test plan with specific database-focused tests
   *
   * @tags Testing, dbtn/module:test_plan
   * @name get_detailed_database_test_plan
   * @summary Get Detailed Database Test Plan
   * @request GET:/routes/test-plan/database-detailed
   */
  get_detailed_database_test_plan = (params: RequestParams = {}) =>
    this.request<GetDetailedDatabaseTestPlanData, any>({
      path: `/routes/test-plan/database-detailed`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get the end-to-end test plan with all test cases across areas
   *
   * @tags Testing, dbtn/module:test_plan
   * @name get_comprehensive_e2e_test_plan
   * @summary Get Comprehensive E2E Test Plan
   * @request GET:/routes/test-plan/e2e-comprehensive
   */
  get_comprehensive_e2e_test_plan = (params: RequestParams = {}) =>
    this.request<GetComprehensiveE2ETestPlanData, any>({
      path: `/routes/test-plan/e2e-comprehensive`,
      method: "GET",
      ...params,
    });

  /**
   * @description Generate authentication headers for testing Returns headers that can be used for testing authenticated endpoints without requiring actual authentication.
   *
   * @tags Testing, dbtn/module:test_utilities
   * @name get_auth_headers
   * @summary Get Auth Headers
   * @request GET:/routes/test-utilities/auth-headers
   */
  get_auth_headers = (params: RequestParams = {}) =>
    this.request<GetAuthHeadersData, any>({
      path: `/routes/test-utilities/auth-headers`,
      method: "GET",
      ...params,
    });

  /**
   * @description Simulates a successful Stripe checkout without actually charging a card. This is used for testing the subscription flow in development environments. It creates a Stripe customer and subscription in TEST mode, then simulates the webhook events that would be triggered in a real checkout.
   *
   * @tags TestingStripe, dbtn/module:test_stripe
   * @name simulate_checkout
   * @summary Simulate Checkout
   * @request POST:/routes/test-stripe/simulate-checkout
   */
  simulate_checkout = (data: SimulateCheckoutRequest, params: RequestParams = {}) =>
    this.request<SimulateCheckoutData, SimulateCheckoutError>({
      path: `/routes/test-stripe/simulate-checkout`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Simulates a subscription event like cancellation or update. This is used for testing the webhook handling in development environments. It simulates the database updates that would happen in response to a real subscription event without needing to trigger an actual Stripe webhook.
   *
   * @tags TestingStripe, dbtn/module:test_stripe
   * @name simulate_subscription_event
   * @summary Simulate Subscription Event
   * @request POST:/routes/test-stripe/simulate-subscription-event
   */
  simulate_subscription_event = (data: TestEvent, params: RequestParams = {}) =>
    this.request<SimulateSubscriptionEventData, SimulateSubscriptionEventError>({
      path: `/routes/test-stripe/simulate-subscription-event`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get information about the current Stripe test configuration This helps test environments verify that Stripe is properly configured for testing and provides information about available test plans.
   *
   * @tags TestingStripe, dbtn/module:test_stripe
   * @name get_stripe_test_config
   * @summary Get Stripe Test Config
   * @request GET:/routes/test-stripe/test-config
   */
  get_stripe_test_config = (params: RequestParams = {}) =>
    this.request<GetStripeTestConfigData, any>({
      path: `/routes/test-stripe/test-config`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get comprehensive documentation for the testing framework
   *
   * @tags Testing, dbtn/module:test_framework
   * @name get_test_framework_documentation
   * @summary Get Test Framework Documentation
   * @request GET:/routes/test-framework/documentation
   */
  get_test_framework_documentation = (params: RequestParams = {}) =>
    this.request<GetTestFrameworkDocumentationData, any>({
      path: `/routes/test-framework/documentation`,
      method: "GET",
      ...params,
    });

  /**
   * @description Set up a complete test environment Creates test users, games, and submissions as requested. Returns authentication headers and IDs for all created resources.
   *
   * @tags Testing, dbtn/module:test_framework
   * @name setup_test_environment
   * @summary Setup Test Environment
   * @request POST:/routes/test-framework/setup
   */
  setup_test_environment = (data: TestSetupRequest, params: RequestParams = {}) =>
    this.request<SetupTestEnvironmentData, SetupTestEnvironmentError>({
      path: `/routes/test-framework/setup`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Create a test user with authentication token Creates a test user with the specified role and subscription tier. Returns user ID and authentication token that can be used for testing.
   *
   * @tags Testing, dbtn/module:test_framework
   * @name create_test_user
   * @summary Create Test User
   * @request POST:/routes/test-framework/create-user
   */
  create_test_user = (data: TestUserRequest, params: RequestParams = {}) =>
    this.request<CreateTestUserData, CreateTestUserError>({
      path: `/routes/test-framework/create-user`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Check if test mode is available Returns the current mode (development or production) and whether test endpoints are available.
   *
   * @tags Testing, dbtn/module:test_framework
   * @name get_test_mode
   * @summary Get Test Mode
   * @request GET:/routes/test-framework/test-mode
   */
  get_test_mode = (params: RequestParams = {}) =>
    this.request<GetTestModeData, any>({
      path: `/routes/test-framework/test-mode`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get example code for auth bypass in tests Returns example code snippets for bypassing authentication in tests.
   *
   * @tags Testing, dbtn/module:test_framework
   * @name get_auth_bypass_example
   * @summary Get Auth Bypass Example
   * @request GET:/routes/test-framework/test-auth-bypass
   */
  get_auth_bypass_example = (params: RequestParams = {}) =>
    this.request<GetAuthBypassExampleData, any>({
      path: `/routes/test-framework/test-auth-bypass`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get all components
   *
   * @tags Testing, dbtn/module:test_feature_map
   * @name get_components
   * @summary Get Components
   * @request GET:/routes/test-feature-map/components
   */
  get_components = (params: RequestParams = {}) =>
    this.request<GetComponentsData, any>({
      path: `/routes/test-feature-map/components`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get features for a specific component
   *
   * @tags Testing, dbtn/module:test_feature_map
   * @name get_features_for_component
   * @summary Get Features For Component
   * @request GET:/routes/test-feature-map/features-for-component/{component_name}
   */
  get_features_for_component = (
    { componentName, ...query }: GetFeaturesForComponentParams,
    params: RequestParams = {},
  ) =>
    this.request<GetFeaturesForComponentData, GetFeaturesForComponentError>({
      path: `/routes/test-feature-map/features-for-component/${componentName}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get tests that verify a specific feature
   *
   * @tags Testing, dbtn/module:test_feature_map
   * @name get_tests_for_feature
   * @summary Get Tests For Feature
   * @request GET:/routes/test-feature-map/tests-for-feature/{feature_name}
   */
  get_tests_for_feature = ({ featureName, ...query }: GetTestsForFeatureParams, params: RequestParams = {}) =>
    this.request<GetTestsForFeatureData, GetTestsForFeatureError>({
      path: `/routes/test-feature-map/tests-for-feature/${featureName}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get a specific test case
   *
   * @tags Testing, dbtn/module:test_feature_map
   * @name get_test_case
   * @summary Get Test Case
   * @request GET:/routes/test-feature-map/test/{test_id}
   */
  get_test_case = ({ testId, ...query }: GetTestCaseParams, params: RequestParams = {}) =>
    this.request<GetTestCaseData, GetTestCaseError>({
      path: `/routes/test-feature-map/test/${testId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Update an existing test case
   *
   * @tags Testing, dbtn/module:test_feature_map
   * @name update_test_case
   * @summary Update Test Case
   * @request PUT:/routes/test-feature-map/test/{test_id}
   */
  update_test_case = ({ testId, ...query }: UpdateTestCaseParams, data: TestCaseInput, params: RequestParams = {}) =>
    this.request<UpdateTestCaseData, UpdateTestCaseError>({
      path: `/routes/test-feature-map/test/${testId}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Delete a test case
   *
   * @tags Testing, dbtn/module:test_feature_map
   * @name delete_test_case
   * @summary Delete Test Case
   * @request DELETE:/routes/test-feature-map/test/{test_id}
   */
  delete_test_case = ({ testId, ...query }: DeleteTestCaseParams, params: RequestParams = {}) =>
    this.request<DeleteTestCaseData, DeleteTestCaseError>({
      path: `/routes/test-feature-map/test/${testId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Get all test cases
   *
   * @tags Testing, dbtn/module:test_feature_map
   * @name get_all_test_cases
   * @summary Get All Test Cases
   * @request GET:/routes/test-feature-map/tests
   */
  get_all_test_cases = (params: RequestParams = {}) =>
    this.request<GetAllTestCasesData, any>({
      path: `/routes/test-feature-map/tests`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create a new test case
   *
   * @tags Testing, dbtn/module:test_feature_map
   * @name create_test_case
   * @summary Create Test Case
   * @request POST:/routes/test-feature-map/test
   */
  create_test_case = (data: TestCaseInput, params: RequestParams = {}) =>
    this.request<CreateTestCaseData, CreateTestCaseError>({
      path: `/routes/test-feature-map/test`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Record results from a test execution
   *
   * @tags Testing, dbtn/module:test_feature_map
   * @name record_test_results
   * @summary Record Test Results
   * @request POST:/routes/test-feature-map/test-results
   */
  record_test_results = (data: TestResults, params: RequestParams = {}) =>
    this.request<RecordTestResultsData, RecordTestResultsError>({
      path: `/routes/test-feature-map/test-results`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Create a test execution plan
   *
   * @tags Testing, dbtn/module:test_feature_map
   * @name create_test_execution_plan
   * @summary Create Test Execution Plan
   * @request POST:/routes/test-feature-map/execution-plan
   */
  create_test_execution_plan = (data: TestExecutionPlan, params: RequestParams = {}) =>
    this.request<CreateTestExecutionPlanData, CreateTestExecutionPlanError>({
      path: `/routes/test-feature-map/execution-plan`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get coverage of features by tests
   *
   * @tags Testing, dbtn/module:test_feature_map
   * @name get_test_coverage
   * @summary Get Test Coverage
   * @request GET:/routes/test-feature-map/test-coverage
   */
  get_test_coverage = (params: RequestParams = {}) =>
    this.request<GetTestCoverageData, any>({
      path: `/routes/test-feature-map/test-coverage`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get summary of components, features, and test coverage
   *
   * @tags Testing, dbtn/module:test_feature_map
   * @name get_map_summary
   * @summary Get Map Summary
   * @request GET:/routes/test-feature-map/map-summary
   */
  get_map_summary = (params: RequestParams = {}) =>
    this.request<GetMapSummaryData, any>({
      path: `/routes/test-feature-map/map-summary`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get the troubleshooting guide for common test failures
   *
   * @tags Testing, dbtn/module:test_troubleshooting
   * @name get_troubleshooting_guide2
   * @summary Get Troubleshooting Guide2
   * @request GET:/routes/test-troubleshooting/
   */
  get_troubleshooting_guide2 = (params: RequestParams = {}) =>
    this.request<GetTroubleshootingGuide2Data, any>({
      path: `/routes/test-troubleshooting/`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get a specific troubleshooting guide item
   *
   * @tags Testing, dbtn/module:test_troubleshooting
   * @name get_troubleshooting_item2
   * @summary Get Troubleshooting Item2
   * @request GET:/routes/test-troubleshooting/{item_id}
   */
  get_troubleshooting_item2 = ({ itemId, ...query }: GetTroubleshootingItem2Params, params: RequestParams = {}) =>
    this.request<GetTroubleshootingItem2Data, GetTroubleshootingItem2Error>({
      path: `/routes/test-troubleshooting/${itemId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Start a test run
   *
   * @tags Testing, dbtn/module:test_runner_cli
   * @name run_tests
   * @summary Run Tests
   * @request POST:/routes/test-runner-cli/run
   */
  run_tests = (data: AppApisTestRunnerCliTestRunRequest, params: RequestParams = {}) =>
    this.request<RunTestsData, RunTestsError>({
      path: `/routes/test-runner-cli/run`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get the status of a test run
   *
   * @tags Testing, dbtn/module:test_runner_cli
   * @name get_test_run_status
   * @summary Get Test Run Status
   * @request GET:/routes/test-runner-cli/status/{run_id}
   */
  get_test_run_status = ({ runId, ...query }: GetTestRunStatusParams, params: RequestParams = {}) =>
    this.request<GetTestRunStatusData, GetTestRunStatusError>({
      path: `/routes/test-runner-cli/status/${runId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get the results of a test run
   *
   * @tags Testing, dbtn/module:test_runner_cli
   * @name get_test_run_results
   * @summary Get Test Run Results
   * @request GET:/routes/test-runner-cli/results/{run_id}
   */
  get_test_run_results = ({ runId, ...query }: GetTestRunResultsParams, params: RequestParams = {}) =>
    this.request<GetTestRunResultsData, GetTestRunResultsError>({
      path: `/routes/test-runner-cli/results/${runId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description List recent test runs
   *
   * @tags Testing, dbtn/module:test_runner_cli
   * @name list_test_runs
   * @summary List Test Runs
   * @request GET:/routes/test-runner-cli/runs
   */
  list_test_runs = (query: ListTestRunsParams, params: RequestParams = {}) =>
    this.request<ListTestRunsData, ListTestRunsError>({
      path: `/routes/test-runner-cli/runs`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Run validation tests on critical fixes for MYA-83 Tests that the database fix, authentication improvements, and Stripe testing enhancements are working correctly.
   *
   * @tags Testing, dbtn/module:test_validation
   * @name validate_fixes2
   * @summary Validate Fixes2
   * @request POST:/routes/test-validation/validate-fixes
   */
  validate_fixes2 = (data: TestValidationRequest, params: RequestParams = {}) =>
    this.request<ValidateFixes2Data, ValidateFixes2Error>({
      path: `/routes/test-validation/validate-fixes`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get the main test documentation
   *
   * @tags Testing, dbtn/module:test_documentation
   * @name get_test_documentation
   * @summary Get Test Documentation
   * @request GET:/routes/test-documentation/
   */
  get_test_documentation = (params: RequestParams = {}) =>
    this.request<GetTestDocumentationData, any>({
      path: `/routes/test-documentation/`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get the troubleshooting guide for common test failures
   *
   * @tags Testing, dbtn/module:test_documentation
   * @name get_troubleshooting_guide
   * @summary Get Troubleshooting Guide
   * @request GET:/routes/test-documentation/troubleshooting
   */
  get_troubleshooting_guide = (params: RequestParams = {}) =>
    this.request<GetTroubleshootingGuideData, any>({
      path: `/routes/test-documentation/troubleshooting`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get a specific troubleshooting guide item
   *
   * @tags Testing, dbtn/module:test_documentation
   * @name get_troubleshooting_item
   * @summary Get Troubleshooting Item
   * @request GET:/routes/test-documentation/troubleshooting/{item_id}
   */
  get_troubleshooting_item = ({ itemId, ...query }: GetTroubleshootingItemParams, params: RequestParams = {}) =>
    this.request<GetTroubleshootingItemData, GetTroubleshootingItemError>({
      path: `/routes/test-documentation/troubleshooting/${itemId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get the guide for setting up the test environment
   *
   * @tags Testing, dbtn/module:test_documentation
   * @name get_environment_setup_guide
   * @summary Get Environment Setup Guide
   * @request GET:/routes/test-documentation/environment-setup
   */
  get_environment_setup_guide = (params: RequestParams = {}) =>
    this.request<GetEnvironmentSetupGuideData, any>({
      path: `/routes/test-documentation/environment-setup`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get the guide for extending the test suite
   *
   * @tags Testing, dbtn/module:test_documentation
   * @name get_extension_guide
   * @summary Get Extension Guide
   * @request GET:/routes/test-documentation/extension-guide
   */
  get_extension_guide = (params: RequestParams = {}) =>
    this.request<GetExtensionGuideData, any>({
      path: `/routes/test-documentation/extension-guide`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get a comprehensive end-to-end test plan
   *
   * @tags Testing, dbtn/module:test_documentation
   * @name get_comprehensive_e2e_test_plan2
   * @summary Get Comprehensive E2E Test Plan2
   * @request GET:/routes/test-documentation/comprehensive-plan
   */
  get_comprehensive_e2e_test_plan2 = (params: RequestParams = {}) =>
    this.request<GetComprehensiveE2ETestPlan2Data, any>({
      path: `/routes/test-documentation/comprehensive-plan`,
      method: "GET",
      ...params,
    });

  /**
   * @description Test the signup process flow
   *
   * @tags Testing, dbtn/module:testing
   * @name test_signup
   * @summary Test Signup
   * @request POST:/routes/testing/signup
   */
  test_signup = (data: TestSignupRequest, params: RequestParams = {}) =>
    this.request<TestSignupData, TestSignupError>({
      path: `/routes/testing/signup`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Test sending notifications to a user
   *
   * @tags Testing, dbtn/module:testing
   * @name test_notification_delivery
   * @summary Test Notification Delivery
   * @request POST:/routes/testing/notification
   */
  test_notification_delivery = (data: TestNotificationRequest, params: RequestParams = {}) =>
    this.request<TestNotificationDeliveryData, TestNotificationDeliveryError>({
      path: `/routes/testing/notification`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Test multi-device support for a user
   *
   * @tags Testing, dbtn/module:testing
   * @name test_multi_device
   * @summary Test Multi Device
   * @request POST:/routes/testing/multi-device
   */
  test_multi_device = (data: TestMultiDeviceRequest, params: RequestParams = {}) =>
    this.request<TestMultiDeviceData, TestMultiDeviceError>({
      path: `/routes/testing/multi-device`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Test edge cases for notifications
   *
   * @tags Testing, dbtn/module:testing
   * @name test_edge_cases
   * @summary Test Edge Cases
   * @request POST:/routes/testing/edge-cases
   */
  test_edge_cases = (data: TestNotificationRequest, params: RequestParams = {}) =>
    this.request<TestEdgeCasesData, TestEdgeCasesError>({
      path: `/routes/testing/edge-cases`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Generate a comprehensive test report
   *
   * @tags Testing, dbtn/module:testing
   * @name generate_test_report
   * @summary Generate Test Report
   * @request GET:/routes/testing/generate-report
   */
  generate_test_report = (params: RequestParams = {}) =>
    this.request<GenerateTestReportData, any>({
      path: `/routes/testing/generate-report`,
      method: "GET",
      ...params,
    });

  /**
   * @description Validate that all system components are properly configured and working
   *
   * @tags Testing, dbtn/module:testing
   * @name validate_components
   * @summary Validate Components
   * @request POST:/routes/testing/validation
   */
  validate_components = (data: ValidateComponentsPayload, params: RequestParams = {}) =>
    this.request<ValidateComponentsData, ValidateComponentsError>({
      path: `/routes/testing/validation`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get the production configuration checklist
   *
   * @tags Admin, dbtn/module:production_checklist
   * @name get_production_checklist
   * @summary Get Production Checklist
   * @request GET:/routes/production-checklist/
   */
  get_production_checklist = (params: RequestParams = {}) =>
    this.request<GetProductionChecklistData, any>({
      path: `/routes/production-checklist/`,
      method: "GET",
      ...params,
    });

  /**
   * @description Register a new beta tester with their email address
   *
   * @tags dbtn/module:beta_signup
   * @name create_beta_signup
   * @summary Create Beta Signup
   * @request POST:/routes/beta-signup
   */
  create_beta_signup = (data: BetaSignupRequest, params: RequestParams = {}) =>
    this.request<CreateBetaSignupData, CreateBetaSignupError>({
      path: `/routes/beta-signup`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Retrieves the pair of companies for the game. - In Sandbox mode (DEV) with a specific game ID set, fetches that game. - Otherwise, fetches today's scheduled game. Raises a 404 error if the required game data is not found.
   *
   * @tags dbtn/module:predictions_api
   * @name get_daily_prediction_pair
   * @summary Get Daily Prediction Pair
   * @request GET:/routes/predictions/daily-pair
   */
  get_daily_prediction_pair = (params: RequestParams = {}) =>
    this.request<GetDailyPredictionPairData, any>({
      path: `/routes/predictions/daily-pair`,
      method: "GET",
      ...params,
    });

  /**
   * @description Processes the results for a given game date and exchange. 1. Fetches game details. 2. Uses yfinance to determine the winner. 3. Updates the game table with the winner. 4. Calculates market timings and prediction time taken. 5. Updates associated predictions with correctness and time. 6. Placeholder for triggering leaderboard update.
   *
   * @tags dbtn/module:predictions_api
   * @name process_game_results
   * @summary Process Game Results
   * @request POST:/routes/predictions/process-results
   */
  process_game_results = (data: ProcessResultsRequest, params: RequestParams = {}) =>
    this.request<ProcessGameResultsData, ProcessGameResultsError>({
      path: `/routes/predictions/process-results`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Submits a user's prediction for the daily pair. Stores the prediction in Supabase 'predictions' table. Includes check for duplicate predictions.
   *
   * @tags dbtn/module:predictions_api
   * @name submit_prediction
   * @summary Submit Prediction
   * @request POST:/routes/predictions/submit
   */
  submit_prediction = (data: PredictionRequest, params: RequestParams = {}) =>
    this.request<SubmitPredictionData, SubmitPredictionError>({
      path: `/routes/predictions/submit`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Retrieves the next_day_clue from the most recent game record on or before today. Returns the clue if found, otherwise null.
   *
   * @tags dbtn/module:predictions_api
   * @name get_next_game_clue
   * @summary Get Next Game Clue
   * @request GET:/routes/predictions/next-clue
   */
  get_next_game_clue = (params: RequestParams = {}) =>
    this.request<GetNextGameClueData, any>({
      path: `/routes/predictions/next-clue`,
      method: "GET",
      ...params,
    });

  /**
   * @description Send a notification to a specific user
   *
   * @tags FCM, dbtn/module:fcm
   * @name send_notification
   * @summary Send Notification
   * @request POST:/routes/fcm/send
   */
  send_notification = (data: NotificationRequest, params: RequestParams = {}) =>
    this.request<SendNotificationData, SendNotificationError>({
      path: `/routes/fcm/send`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Send a notification to multiple users (admin only)
   *
   * @tags FCM, dbtn/module:fcm
   * @name admin_send_notification
   * @summary Admin Send Notification
   * @request POST:/routes/fcm/admin/send
   */
  admin_send_notification = (data: AdminNotificationRequest, params: RequestParams = {}) =>
    this.request<AdminSendNotificationData, AdminSendNotificationError>({
      path: `/routes/fcm/admin/send`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Send a test notification to the current user
   *
   * @tags FCM, dbtn/module:fcm
   * @name test_notification
   * @summary Test Notification
   * @request POST:/routes/fcm/test
   */
  test_notification = (params: RequestParams = {}) =>
    this.request<TestNotificationData, TestNotificationError>({
      path: `/routes/fcm/test`,
      method: "POST",
      ...params,
    });

  /**
   * @description Send a notification to all users with a specific subscription tier (admin only)
   *
   * @tags FCM, dbtn/module:fcm
   * @name admin_batch_notification
   * @summary Admin Batch Notification
   * @request POST:/routes/fcm/admin/batch
   */
  admin_batch_notification = (data: BatchNotificationRequest, params: RequestParams = {}) =>
    this.request<AdminBatchNotificationData, AdminBatchNotificationError>({
      path: `/routes/fcm/admin/batch`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Store a Firebase Cloud Messaging token for push notifications
   *
   * @tags dbtn/module:fcm_api
   * @name register_device_fcm_token
   * @summary Register Device Fcm Token
   * @request POST:/routes/device-fcm-token
   */
  register_device_fcm_token = (data: FcmTokenRequest, params: RequestParams = {}) =>
    this.request<RegisterDeviceFcmTokenData, RegisterDeviceFcmTokenError>({
      path: `/routes/device-fcm-token`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description List all admin role assignments Returns a list of all users with admin roles. Requires MANAGE_USERS permission.
   *
   * @tags admin, dbtn/module:admin_permissions_api
   * @name list_admin_roles2
   * @summary List Admin Roles2
   * @request GET:/routes/admin-roles/list
   */
  list_admin_roles2 = (params: RequestParams = {}) =>
    this.request<ListAdminRoles2Data, ListAdminRoles2Error>({
      path: `/routes/admin-roles/list`,
      method: "GET",
      ...params,
    });

  /**
   * @description Assign an admin role to a user Args: user_id: ID of the user to assign the role to role: Role to assign ("admin" or "super_admin") Returns: Success message Requires MANAGE_USERS permission.
   *
   * @tags admin, dbtn/module:admin_permissions_api
   * @name assign_admin_role2
   * @summary Assign Admin Role2
   * @request POST:/routes/admin-roles/assign/{user_id}
   */
  assign_admin_role2 = ({ userId, ...query }: AssignAdminRole2Params, params: RequestParams = {}) =>
    this.request<AssignAdminRole2Data, AssignAdminRole2Error>({
      path: `/routes/admin-roles/assign/${userId}`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Remove admin role from a user Args: user_id: ID of the user to remove the role from Returns: Success message Requires MANAGE_USERS permission.
   *
   * @tags admin, dbtn/module:admin_permissions_api
   * @name remove_admin_role2
   * @summary Remove Admin Role2
   * @request DELETE:/routes/admin-roles/remove/{user_id}
   */
  remove_admin_role2 = ({ userId, ...query }: RemoveAdminRole2Params, params: RequestParams = {}) =>
    this.request<RemoveAdminRole2Data, RemoveAdminRole2Error>({
      path: `/routes/admin-roles/remove/${userId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Migrate admin roles from Databutton storage to Supabase One-time migration endpoint to transfer existing role assignments. Returns: Migration results Requires MANAGE_SYSTEM permission.
   *
   * @tags admin, dbtn/module:admin_permissions_api
   * @name migrate_roles2
   * @summary Migrate Roles2
   * @request POST:/routes/admin-roles/migrate
   */
  migrate_roles2 = (params: RequestParams = {}) =>
    this.request<MigrateRoles2Data, MigrateRoles2Error>({
      path: `/routes/admin-roles/migrate`,
      method: "POST",
      ...params,
    });

  /**
   * @description Accepts a CSV file upload containing daily game matchup data and a target table name. Parses the CSV, validates each row against the GameData model, and upserts valid records into the specified Supabase table (ASX_GAMES or NYSE_GAMES). Expected CSV Columns (matching GameData fields, using alias 'date'): - exchange - date (YYYY-MM-DD) - company_a_ticker - company_a_name - company_b_ticker - company_b_name - sector - reasoning - submitted_by_player_id (optional, UUID) - next_day_clue (optional) - status (optional, defaults to 'scheduled')
   *
   * @tags Admin, dbtn/module:admin_api
   * @name upload_game_data_csv
   * @summary Upload Game Data Csv
   * @request POST:/routes/admin/upload-game-data
   */
  upload_game_data_csv = (data: BodyUploadGameDataCsv, params: RequestParams = {}) =>
    this.request<UploadGameDataCsvData, UploadGameDataCsvError>({
      path: `/routes/admin/upload-game-data`,
      method: "POST",
      body: data,
      type: ContentType.FormData,
      ...params,
    });

  /**
   * @description Create a new game manually with the provided data.
   *
   * @tags Admin, dbtn/module:admin_api
   * @name create_game
   * @summary Create Game
   * @request POST:/routes/admin/games
   */
  create_game = (data: GameCreateRequest, params: RequestParams = {}) =>
    this.request<CreateGameData, CreateGameError>({
      path: `/routes/admin/games`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description List games with optional filtering by exchange, date range, and status.
   *
   * @tags Admin, dbtn/module:admin_api
   * @name list_games
   * @summary List Games
   * @request GET:/routes/admin/games
   */
  list_games = (query: ListGamesParams, params: RequestParams = {}) =>
    this.request<ListGamesData, ListGamesError>({
      path: `/routes/admin/games`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get a specific game by its pair_id.
   *
   * @tags Admin, dbtn/module:admin_api
   * @name get_game
   * @summary Get Game
   * @request GET:/routes/admin/games/{pair_id}
   */
  get_game = ({ pairId, ...query }: GetGameParams, params: RequestParams = {}) =>
    this.request<GetGameData, GetGameError>({
      path: `/routes/admin/games/${pairId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Update a specific game by its pair_id.
   *
   * @tags Admin, dbtn/module:admin_api
   * @name update_game
   * @summary Update Game
   * @request PUT:/routes/admin/games/{pair_id}
   */
  update_game = ({ pairId, ...query }: UpdateGameParams, data: GameUpdateRequest, params: RequestParams = {}) =>
    this.request<UpdateGameData, UpdateGameError>({
      path: `/routes/admin/games/${pairId}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Delete a specific game by its pair_id.
   *
   * @tags Admin, dbtn/module:admin_api
   * @name delete_game
   * @summary Delete Game
   * @request DELETE:/routes/admin/games/{pair_id}
   */
  delete_game = ({ pairId, ...query }: DeleteGameParams, params: RequestParams = {}) =>
    this.request<DeleteGameData, DeleteGameError>({
      path: `/routes/admin/games/${pairId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Allow users to submit game ideas for admin review.
   *
   * @tags Admin, dbtn/module:admin_api
   * @name create_game_submission
   * @summary Create Game Submission
   * @request POST:/routes/admin/submissions
   */
  create_game_submission = (data: SubmissionCreateRequest, params: RequestParams = {}) =>
    this.request<CreateGameSubmissionData, CreateGameSubmissionError>({
      path: `/routes/admin/submissions`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description List all game submissions with optional filtering by status.
   *
   * @tags Admin, dbtn/module:admin_api
   * @name list_game_submissions
   * @summary List Game Submissions
   * @request GET:/routes/admin/submissions
   */
  list_game_submissions = (query: ListGameSubmissionsParams, params: RequestParams = {}) =>
    this.request<ListGameSubmissionsData, ListGameSubmissionsError>({
      path: `/routes/admin/submissions`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Update a game submission status (approve/reject) and optionally schedule it.
   *
   * @tags Admin, dbtn/module:admin_api
   * @name update_game_submission
   * @summary Update Game Submission
   * @request PUT:/routes/admin/submissions/{submission_id}
   */
  update_game_submission = (
    { submissionId, ...query }: UpdateGameSubmissionParams,
    data: SubmissionUpdateRequest,
    params: RequestParams = {},
  ) =>
    this.request<UpdateGameSubmissionData, UpdateGameSubmissionError>({
      path: `/routes/admin/submissions/${submissionId}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description List all users with administrative roles. DEPRECATED: Use /admin-roles/list instead.
   *
   * @tags Admin, Admin, dbtn/module:admin_api
   * @name list_admin_roles
   * @summary List Admin Roles
   * @request GET:/routes/admin/roles
   * @deprecated
   */
  list_admin_roles = (params: RequestParams = {}) =>
    this.request<ListAdminRolesData, ListAdminRolesError>({
      path: `/routes/admin/roles`,
      method: "GET",
      ...params,
    });

  /**
   * @description Assign an administrative role to a user. DEPRECATED: Use /admin-roles/assign/{user_id} instead.
   *
   * @tags Admin, Admin, dbtn/module:admin_api
   * @name assign_admin_role
   * @summary Assign Admin Role
   * @request POST:/routes/admin/roles/{user_id}
   * @deprecated
   */
  assign_admin_role = (
    { userId, ...query }: AssignAdminRoleParams,
    data: AdminRoleRequest,
    params: RequestParams = {},
  ) =>
    this.request<AssignAdminRoleData, AssignAdminRoleError>({
      path: `/routes/admin/roles/${userId}`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Remove administrative role from a user. DEPRECATED: Use /admin-roles/remove/{user_id} instead.
   *
   * @tags Admin, Admin, dbtn/module:admin_api
   * @name remove_admin_role
   * @summary Remove Admin Role
   * @request DELETE:/routes/admin/roles/{user_id}
   * @deprecated
   */
  remove_admin_role = ({ userId, ...query }: RemoveAdminRoleParams, params: RequestParams = {}) =>
    this.request<RemoveAdminRoleData, RemoveAdminRoleError>({
      path: `/routes/admin/roles/${userId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Migrate admin roles from Databutton storage to Supabase. This endpoint triggers the one-time migration of admin roles from Databutton storage to the Supabase admin_roles table.
   *
   * @tags Admin, Admin, dbtn/module:admin_api
   * @name migrate_roles
   * @summary Migrate Roles
   * @request POST:/routes/admin/migrate-roles
   */
  migrate_roles = (params: RequestParams = {}) =>
    this.request<MigrateRolesData, MigrateRolesError>({
      path: `/routes/admin/migrate-roles`,
      method: "POST",
      ...params,
    });

  /**
   * @description List all users with optional filtering.
   *
   * @tags Admin, dbtn/module:admin_api
   * @name list_users
   * @summary List Users
   * @request GET:/routes/admin/users
   */
  list_users = (query: ListUsersParams, params: RequestParams = {}) =>
    this.request<ListUsersData, ListUsersError>({
      path: `/routes/admin/users`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Update a user's admin status or active status.
   *
   * @tags Admin, dbtn/module:admin_api
   * @name update_user_status
   * @summary Update User Status
   * @request PUT:/routes/admin/users/{user_id}
   */
  update_user_status = (
    { userId, ...query }: UpdateUserStatusParams,
    data: UserStatusUpdateRequest,
    params: RequestParams = {},
  ) =>
    this.request<UpdateUserStatusData, UpdateUserStatusError>({
      path: `/routes/admin/users/${userId}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Migrates sandbox settings from Databutton storage to Supabase.
   *
   * @tags dbtn/module:sandbox_control_api
   * @name migrate_sandbox_settings
   * @summary Migrate Sandbox Settings
   * @request POST:/routes/admin/migrate-sandbox-settings
   */
  migrate_sandbox_settings = (params: RequestParams = {}) =>
    this.request<MigrateSandboxSettingsData, MigrateSandboxSettingsError>({
      path: `/routes/admin/migrate-sandbox-settings`,
      method: "POST",
      ...params,
    });

  /**
   * @description Returns the current sandbox mode status and the configured game ID.
   *
   * @tags dbtn/module:sandbox_control_api
   * @name get_sandbox_status
   * @summary Get Sandbox Status
   * @request GET:/routes/sandbox/status
   */
  get_sandbox_status = (params: RequestParams = {}) =>
    this.request<GetSandboxStatusData, GetSandboxStatusError>({
      path: `/routes/sandbox/status`,
      method: "GET",
      ...params,
    });

  /**
   * @description Sets or clears the game ID to be used for sandbox testing.
   *
   * @tags dbtn/module:sandbox_control_api
   * @name set_sandbox_game
   * @summary Set Sandbox Game
   * @request POST:/routes/sandbox/set-game
   */
  set_sandbox_game = (data: SetGameRequest, params: RequestParams = {}) =>
    this.request<SetSandboxGameData, SetSandboxGameError>({
      path: `/routes/sandbox/set-game`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Manually sets the status of the current sandbox game to 'closed'. Only works in DEV mode.
   *
   * @tags dbtn/module:sandbox_control_api
   * @name trigger_close_predictions
   * @summary Trigger Close Predictions
   * @request POST:/routes/sandbox/trigger-close-predictions
   */
  trigger_close_predictions = (params: RequestParams = {}) =>
    this.request<TriggerClosePredictionsData, TriggerClosePredictionsError>({
      path: `/routes/sandbox/trigger-close-predictions`,
      method: "POST",
      ...params,
    });

  /**
   * @description Manually triggers the process_game_results logic for the current sandbox game. Only works in DEV mode.
   *
   * @tags dbtn/module:sandbox_control_api
   * @name trigger_process_results
   * @summary Trigger Process Results
   * @request POST:/routes/sandbox/trigger-process-results
   */
  trigger_process_results = (params: RequestParams = {}) =>
    this.request<TriggerProcessResultsData, TriggerProcessResultsError>({
      path: `/routes/sandbox/trigger-process-results`,
      method: "POST",
      ...params,
    });

  /**
   * @description (Simulated) Manually triggers the leaderboard update logic. Only works in DEV mode.
   *
   * @tags dbtn/module:sandbox_control_api
   * @name trigger_leaderboard_update
   * @summary Trigger Leaderboard Update
   * @request POST:/routes/sandbox/trigger-leaderboard-update
   */
  trigger_leaderboard_update = (params: RequestParams = {}) =>
    this.request<TriggerLeaderboardUpdateData, TriggerLeaderboardUpdateError>({
      path: `/routes/sandbox/trigger-leaderboard-update`,
      method: "POST",
      ...params,
    });

  /**
   * @description Get the current status of the cron job
   *
   * @tags cron, dbtn/module:cron
   * @name get_cron_status
   * @summary Get Cron Status
   * @request GET:/routes/cron/status
   */
  get_cron_status = (params: RequestParams = {}) =>
    this.request<GetCronStatusData, GetCronStatusError>({
      path: `/routes/cron/status`,
      method: "GET",
      ...params,
    });

  /**
   * @description Enable the cron job
   *
   * @tags cron, dbtn/module:cron
   * @name enable_cron
   * @summary Enable Cron
   * @request POST:/routes/cron/enable
   */
  enable_cron = (params: RequestParams = {}) =>
    this.request<EnableCronData, EnableCronError>({
      path: `/routes/cron/enable`,
      method: "POST",
      ...params,
    });

  /**
   * @description Disable the cron job
   *
   * @tags cron, dbtn/module:cron
   * @name disable_cron
   * @summary Disable Cron
   * @request POST:/routes/cron/disable
   */
  disable_cron = (params: RequestParams = {}) =>
    this.request<DisableCronData, DisableCronError>({
      path: `/routes/cron/disable`,
      method: "POST",
      ...params,
    });

  /**
   * @description Set the interval for the cron job
   *
   * @tags cron, dbtn/module:cron
   * @name set_cron_interval
   * @summary Set Cron Interval
   * @request POST:/routes/cron/set-interval
   */
  set_cron_interval = (query: SetCronIntervalParams, params: RequestParams = {}) =>
    this.request<SetCronIntervalData, SetCronIntervalError>({
      path: `/routes/cron/set-interval`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Trigger the cron job to run all scheduled tasks
   *
   * @tags cron, dbtn/module:cron
   * @name trigger_cron
   * @summary Trigger Cron
   * @request POST:/routes/cron/trigger
   */
  trigger_cron = (query: TriggerCronParams, params: RequestParams = {}) =>
    this.request<TriggerCronData, TriggerCronError>({
      path: `/routes/cron/trigger`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Manually trigger the cron job to run immediately
   *
   * @tags cron, dbtn/module:cron
   * @name run_cron_now
   * @summary Run Cron Now
   * @request POST:/routes/cron/run-now
   */
  run_cron_now = (params: RequestParams = {}) =>
    this.request<RunCronNowData, RunCronNowError>({
      path: `/routes/cron/run-now`,
      method: "POST",
      ...params,
    });

  /**
   * @description Migrate cron configuration from Databutton to Supabase
   *
   * @tags cron, dbtn/module:cron
   * @name migrate_cron_to_supabase
   * @summary Migrate Cron To Supabase
   * @request POST:/routes/cron/migrate-to-supabase
   */
  migrate_cron_to_supabase = (params: RequestParams = {}) =>
    this.request<MigrateCronToSupabaseData, MigrateCronToSupabaseError>({
      path: `/routes/cron/migrate-to-supabase`,
      method: "POST",
      ...params,
    });

  /**
   * @description Toggle a task's active status
   *
   * @tags dbtn/module:toggle_task_active
   * @name toggle_task_active2
   * @summary Toggle Task Active2
   * @request POST:/routes/toggle-task-active2
   */
  toggle_task_active2 = (data: ToggleTaskRequest, params: RequestParams = {}) =>
    this.request<ToggleTaskActive2Data, ToggleTaskActive2Error>({
      path: `/routes/toggle-task-active2`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Toggle a task's active status (Main scheduler version)
   *
   * @tags scheduler, dbtn/module:scheduler
   * @name toggle_task_active
   * @summary Toggle Task Active
   * @request POST:/routes/scheduler/toggle-task-active
   */
  toggle_task_active = (data: ToggleTaskRequest, params: RequestParams = {}) =>
    this.request<ToggleTaskActiveData, ToggleTaskActiveError>({
      path: `/routes/scheduler/toggle-task-active`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Migrate scheduler config from Databutton to Supabase
   *
   * @tags scheduler, dbtn/module:scheduler
   * @name migrate_scheduler_to_supabase
   * @summary Migrate Scheduler To Supabase
   * @request POST:/routes/scheduler/migrate-to-supabase
   */
  migrate_scheduler_to_supabase = (params: RequestParams = {}) =>
    this.request<MigrateSchedulerToSupabaseData, MigrateSchedulerToSupabaseError>({
      path: `/routes/scheduler/migrate-to-supabase`,
      method: "POST",
      ...params,
    });

  /**
   * @description Migrate scheduler errors from Databutton to Supabase
   *
   * @tags scheduler, dbtn/module:scheduler
   * @name migrate_scheduler_errors_to_supabase
   * @summary Migrate Scheduler Errors To Supabase
   * @request POST:/routes/scheduler/migrate-errors-to-supabase
   */
  migrate_scheduler_errors_to_supabase = (params: RequestParams = {}) =>
    this.request<MigrateSchedulerErrorsToSupabaseData, MigrateSchedulerErrorsToSupabaseError>({
      path: `/routes/scheduler/migrate-errors-to-supabase`,
      method: "POST",
      ...params,
    });

  /**
   * @description Migrate cron config from Databutton to Supabase (migrated to cron module)
   *
   * @tags scheduler, dbtn/module:scheduler
   * @name migrate_cron_to_supabase2
   * @summary Migrate Cron To Supabase2
   * @request POST:/routes/scheduler/migrate-cron-to-supabase2
   */
  migrate_cron_to_supabase2 = (params: RequestParams = {}) =>
    this.request<MigrateCronToSupabase2Data, MigrateCronToSupabase2Error>({
      path: `/routes/scheduler/migrate-cron-to-supabase2`,
      method: "POST",
      ...params,
    });

  /**
   * @description Get comprehensive documentation for the scheduler system
   *
   * @tags scheduler, dbtn/module:scheduler
   * @name get_documentation2
   * @summary Get Documentation2
   * @request GET:/routes/scheduler/documentation2
   */
  get_documentation2 = (params: RequestParams = {}) =>
    this.request<GetDocumentation2Data, GetDocumentation2Error>({
      path: `/routes/scheduler/documentation2`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get the current status of the scheduler
   *
   * @tags scheduler, dbtn/module:scheduler
   * @name get_scheduler_status
   * @summary Get Scheduler Status
   * @request GET:/routes/scheduler/status
   */
  get_scheduler_status = (params: RequestParams = {}) =>
    this.request<GetSchedulerStatusData, GetSchedulerStatusError>({
      path: `/routes/scheduler/status`,
      method: "GET",
      ...params,
    });

  /**
   * @description Initialize the scheduler with default tasks
   *
   * @tags scheduler, dbtn/module:scheduler
   * @name initialize_scheduler_endpoint
   * @summary Initialize Scheduler Endpoint
   * @request POST:/routes/scheduler/initialize
   */
  initialize_scheduler_endpoint = (params: RequestParams = {}) =>
    this.request<InitializeSchedulerEndpointData, InitializeSchedulerEndpointError>({
      path: `/routes/scheduler/initialize`,
      method: "POST",
      ...params,
    });

  /**
   * @description Enable the scheduler
   *
   * @tags scheduler, dbtn/module:scheduler
   * @name enable_scheduler
   * @summary Enable Scheduler
   * @request POST:/routes/scheduler/enable
   */
  enable_scheduler = (params: RequestParams = {}) =>
    this.request<EnableSchedulerData, EnableSchedulerError>({
      path: `/routes/scheduler/enable`,
      method: "POST",
      ...params,
    });

  /**
   * @description Disable the scheduler
   *
   * @tags scheduler, dbtn/module:scheduler
   * @name disable_scheduler
   * @summary Disable Scheduler
   * @request POST:/routes/scheduler/disable
   */
  disable_scheduler = (params: RequestParams = {}) =>
    this.request<DisableSchedulerData, DisableSchedulerError>({
      path: `/routes/scheduler/disable`,
      method: "POST",
      ...params,
    });

  /**
   * @description Manually run a specific scheduled task
   *
   * @tags scheduler, dbtn/module:scheduler
   * @name run_task
   * @summary Run Task
   * @request POST:/routes/scheduler/run-task/{task_id}
   */
  run_task = ({ taskId, ...query }: RunTaskParams, params: RequestParams = {}) =>
    this.request<RunTaskData, RunTaskError>({
      path: `/routes/scheduler/run-task/${taskId}`,
      method: "POST",
      ...params,
    });

  /**
   * @description Manually run all active scheduled tasks
   *
   * @tags scheduler, dbtn/module:scheduler
   * @name run_all_tasks
   * @summary Run All Tasks
   * @request POST:/routes/scheduler/run-all
   */
  run_all_tasks = (params: RequestParams = {}) =>
    this.request<RunAllTasksData, RunAllTasksError>({
      path: `/routes/scheduler/run-all`,
      method: "POST",
      ...params,
    });

  /**
   * @description Toggle whether the scheduler respects sandbox mode
   *
   * @tags scheduler, dbtn/module:scheduler
   * @name toggle_sandbox_mode
   * @summary Toggle Sandbox Mode
   * @request POST:/routes/scheduler/toggle-sandbox-mode
   */
  toggle_sandbox_mode = (params: RequestParams = {}) =>
    this.request<ToggleSandboxModeData, ToggleSandboxModeError>({
      path: `/routes/scheduler/toggle-sandbox-mode`,
      method: "POST",
      ...params,
    });

  /**
   * @description Trigger a check of scheduled tasks
   *
   * @tags scheduler, dbtn/module:scheduler
   * @name trigger_scheduled_tasks_check
   * @summary Trigger Scheduled Tasks Check
   * @request POST:/routes/scheduler/check-scheduled-tasks
   */
  trigger_scheduled_tasks_check = (params: RequestParams = {}) =>
    this.request<TriggerScheduledTasksCheckData, any>({
      path: `/routes/scheduler/check-scheduled-tasks`,
      method: "POST",
      ...params,
    });

  /**
   * @description Get all scheduler error logs from Supabase
   *
   * @tags scheduler, dbtn/module:scheduler
   * @name get_scheduler_errors
   * @summary Get Scheduler Errors
   * @request GET:/routes/scheduler/errors
   */
  get_scheduler_errors = (params: RequestParams = {}) =>
    this.request<GetSchedulerErrorsData, GetSchedulerErrorsError>({
      path: `/routes/scheduler/errors`,
      method: "GET",
      ...params,
    });

  /**
   * @description Mark all scheduler error logs as resolved in Supabase
   *
   * @tags scheduler, dbtn/module:scheduler
   * @name clear_scheduler_errors
   * @summary Clear Scheduler Errors
   * @request POST:/routes/scheduler/clear-errors
   */
  clear_scheduler_errors = (params: RequestParams = {}) =>
    this.request<ClearSchedulerErrorsData, ClearSchedulerErrorsError>({
      path: `/routes/scheduler/clear-errors`,
      method: "POST",
      ...params,
    });

  /**
   * @description Migrate scheduler configuration and errors from Databutton to Supabase
   *
   * @tags scheduler, dbtn/module:scheduler
   * @name migrate_scheduler_to_supabase2
   * @summary Migrate Scheduler To Supabase2
   * @request POST:/routes/scheduler/migrate-scheduler-to-supabase
   */
  migrate_scheduler_to_supabase2 = (params: RequestParams = {}) =>
    this.request<MigrateSchedulerToSupabase2Data, MigrateSchedulerToSupabase2Error>({
      path: `/routes/scheduler/migrate-scheduler-to-supabase`,
      method: "POST",
      ...params,
    });

  /**
   * @description Test the process_results functionality with a specific date
   *
   * @tags scheduler, dbtn/module:scheduler
   * @name test_process_results
   * @summary Test Process Results
   * @request POST:/routes/scheduler/test/process-results
   */
  test_process_results = (query: TestProcessResultsParams, params: RequestParams = {}) =>
    this.request<TestProcessResultsData, TestProcessResultsError>({
      path: `/routes/scheduler/test/process-results`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Test the generate_games functionality
   *
   * @tags scheduler, dbtn/module:scheduler
   * @name test_generate_games
   * @summary Test Generate Games
   * @request POST:/routes/scheduler/test/generate-games
   */
  test_generate_games = (query: TestGenerateGamesParams, params: RequestParams = {}) =>
    this.request<TestGenerateGamesData, TestGenerateGamesError>({
      path: `/routes/scheduler/test/generate-games`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Test the update_clue functionality with a specific date
   *
   * @tags scheduler, dbtn/module:scheduler
   * @name test_update_clue
   * @summary Test Update Clue
   * @request POST:/routes/scheduler/test/update-clue
   */
  test_update_clue = (query: TestUpdateClueParams, params: RequestParams = {}) =>
    this.request<TestUpdateClueData, TestUpdateClueError>({
      path: `/routes/scheduler/test/update-clue`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Test the full scheduler cycle (process results, generate games, update clue)
   *
   * @tags scheduler, dbtn/module:scheduler
   * @name test_full_scheduler_cycle
   * @summary Test Full Scheduler Cycle
   * @request POST:/routes/scheduler/test/full-cycle
   */
  test_full_scheduler_cycle = (query: TestFullSchedulerCycleParams, params: RequestParams = {}) =>
    this.request<TestFullSchedulerCycleData, TestFullSchedulerCycleError>({
      path: `/routes/scheduler/test/full-cycle`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Clean up old sandbox test data while preserving recent entries
   *
   * @tags scheduler, dbtn/module:scheduler
   * @name cleanup_sandbox_test_data
   * @summary Cleanup Sandbox Test Data
   * @request POST:/routes/scheduler/test/cleanup-sandbox-data
   */
  cleanup_sandbox_test_data = (query: CleanupSandboxTestDataParams, params: RequestParams = {}) =>
    this.request<CleanupSandboxTestDataData, CleanupSandboxTestDataError>({
      path: `/routes/scheduler/test/cleanup-sandbox-data`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Get SQL and instructions for migrating scheduler and cron to Supabase
   *
   * @tags dbtn/module:migration_docs
   * @name get_migration_docs
   * @summary Get Migration Docs
   * @request GET:/routes/get-migration-docs
   */
  get_migration_docs = (params: RequestParams = {}) =>
    this.request<GetMigrationDocsData, GetMigrationDocsError>({
      path: `/routes/get-migration-docs`,
      method: "GET",
      ...params,
    });

  /**
   * @description Discover companies from specified exchange with optional filtering
   *
   * @tags dbtn/module:company_discovery
   * @name discover_companies_endpoint
   * @summary Discover Companies Endpoint
   * @request GET:/routes/companies/discover
   */
  discover_companies_endpoint = (query: DiscoverCompaniesEndpointParams, params: RequestParams = {}) =>
    this.request<DiscoverCompaniesEndpointData, DiscoverCompaniesEndpointError>({
      path: `/routes/companies/discover`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Generate a pair of companies from the same sector for comparison
   *
   * @tags dbtn/module:company_discovery
   * @name generate_company_pair_endpoint
   * @summary Generate Company Pair Endpoint
   * @request GET:/routes/companies/pair/generate
   */
  generate_company_pair_endpoint = (query: GenerateCompanyPairEndpointParams, params: RequestParams = {}) =>
    this.request<GenerateCompanyPairEndpointData, GenerateCompanyPairEndpointError>({
      path: `/routes/companies/pair/generate`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get the trading calendar for a specific exchange
   *
   * @tags dbtn/module:company_discovery
   * @name get_exchange_calendar_endpoint
   * @summary Get Exchange Calendar Endpoint
   * @request GET:/routes/exchange/calendar
   */
  get_exchange_calendar_endpoint = (query: GetExchangeCalendarEndpointParams, params: RequestParams = {}) =>
    this.request<GetExchangeCalendarEndpointData, GetExchangeCalendarEndpointError>({
      path: `/routes/exchange/calendar`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get the next trading day for a specific exchange
   *
   * @tags dbtn/module:company_discovery
   * @name get_next_trading_day_endpoint
   * @summary Get Next Trading Day Endpoint
   * @request GET:/routes/exchange/next-trading-day
   */
  get_next_trading_day_endpoint = (query: GetNextTradingDayEndpointParams, params: RequestParams = {}) =>
    this.request<GetNextTradingDayEndpointData, GetNextTradingDayEndpointError>({
      path: `/routes/exchange/next-trading-day`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Test endpoint for company discovery module
   *
   * @tags dbtn/module:company_discovery
   * @name test_company_discovery
   * @summary Test Company Discovery
   * @request GET:/routes/test-company-discovery
   */
  test_company_discovery = (params: RequestParams = {}) =>
    this.request<TestCompanyDiscoveryData, any>({
      path: `/routes/test-company-discovery`,
      method: "GET",
      ...params,
    });

  /**
   * @description Migrate company cache and exchange calendars from Databutton to Supabase
   *
   * @tags dbtn/module:company_discovery
   * @name migrate_company_cache_to_supabase
   * @summary Migrate Company Cache To Supabase
   * @request POST:/routes/company-cache/migrate
   */
  migrate_company_cache_to_supabase = (params: RequestParams = {}) =>
    this.request<MigrateCompanyCacheToSupabaseData, MigrateCompanyCacheToSupabaseError>({
      path: `/routes/company-cache/migrate`,
      method: "POST",
      ...params,
    });

  /**
   * @description Test endpoint for migrating company cache to Supabase (no auth required)
   *
   * @tags dbtn/module:company_discovery
   * @name test_migrate_company_cache_to_supabase
   * @summary Test Migrate Company Cache To Supabase
   * @request GET:/routes/test/migrate-company-cache
   */
  test_migrate_company_cache_to_supabase = (params: RequestParams = {}) =>
    this.request<TestMigrateCompanyCacheToSupabaseData, any>({
      path: `/routes/test/migrate-company-cache`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create required tables in Supabase for test storage
   *
   * @tags Testing, dbtn/module:test_storage
   * @name migrate_test_storage_tables
   * @summary Migrate Test Storage Tables
   * @request POST:/routes/test-storage/migrate-tables
   */
  migrate_test_storage_tables = (params: RequestParams = {}) =>
    this.request<MigrateTestStorageTablesData, any>({
      path: `/routes/test-storage/migrate-tables`,
      method: "POST",
      ...params,
    });

  /**
   * @description Migrate existing test results from Databutton storage to Supabase
   *
   * @tags Testing, dbtn/module:test_storage
   * @name migrate_test_results
   * @summary Migrate Test Results
   * @request POST:/routes/test-storage/migrate-test-results
   */
  migrate_test_results = (params: RequestParams = {}) =>
    this.request<MigrateTestResultsData, any>({
      path: `/routes/test-storage/migrate-test-results`,
      method: "POST",
      ...params,
    });

  /**
   * @description Migrate existing validation results from Databutton storage to Supabase
   *
   * @tags Testing, dbtn/module:test_storage
   * @name migrate_validation_results
   * @summary Migrate Validation Results
   * @request POST:/routes/test-storage/migrate-validation-results
   */
  migrate_validation_results = (params: RequestParams = {}) =>
    this.request<MigrateValidationResultsData, any>({
      path: `/routes/test-storage/migrate-validation-results`,
      method: "POST",
      ...params,
    });

  /**
   * @description Migrate existing coverage reports from Databutton storage to Supabase
   *
   * @tags Testing, dbtn/module:test_storage
   * @name migrate_coverage_reports
   * @summary Migrate Coverage Reports
   * @request POST:/routes/test-storage/migrate-coverage-reports
   */
  migrate_coverage_reports = (params: RequestParams = {}) =>
    this.request<MigrateCoverageReportsData, any>({
      path: `/routes/test-storage/migrate-coverage-reports`,
      method: "POST",
      ...params,
    });

  /**
   * @description Get documentation on the migration process
   *
   * @tags Testing, dbtn/module:test_migration
   * @name get_migration_docs2
   * @summary Get Migration Docs2
   * @request GET:/routes/test-migration/documentation
   */
  get_migration_docs2 = (params: RequestParams = {}) =>
    this.request<GetMigrationDocs2Data, any>({
      path: `/routes/test-migration/documentation`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create required tables in Supabase for test storage
   *
   * @tags Testing, dbtn/module:test_migration
   * @name migrate_test_storage_tables_endpoint
   * @summary Migrate Test Storage Tables Endpoint
   * @request POST:/routes/test-migration/storage-tables
   */
  migrate_test_storage_tables_endpoint = (params: RequestParams = {}) =>
    this.request<MigrateTestStorageTablesEndpointData, any>({
      path: `/routes/test-migration/storage-tables`,
      method: "POST",
      ...params,
    });

  /**
   * @description Migrate existing test results from Databutton storage to Supabase
   *
   * @tags Testing, dbtn/module:test_migration
   * @name migrate_test_results_endpoint
   * @summary Migrate Test Results Endpoint
   * @request POST:/routes/test-migration/test-results
   */
  migrate_test_results_endpoint = (params: RequestParams = {}) =>
    this.request<MigrateTestResultsEndpointData, any>({
      path: `/routes/test-migration/test-results`,
      method: "POST",
      ...params,
    });

  /**
   * @description Migrate existing validation results from Databutton storage to Supabase
   *
   * @tags Testing, dbtn/module:test_migration
   * @name migrate_validation_results_endpoint
   * @summary Migrate Validation Results Endpoint
   * @request POST:/routes/test-migration/validation-results
   */
  migrate_validation_results_endpoint = (params: RequestParams = {}) =>
    this.request<MigrateValidationResultsEndpointData, any>({
      path: `/routes/test-migration/validation-results`,
      method: "POST",
      ...params,
    });

  /**
   * @description Migrate existing coverage reports from Databutton storage to Supabase
   *
   * @tags Testing, dbtn/module:test_migration
   * @name migrate_coverage_reports_endpoint
   * @summary Migrate Coverage Reports Endpoint
   * @request POST:/routes/test-migration/coverage-reports
   */
  migrate_coverage_reports_endpoint = (params: RequestParams = {}) =>
    this.request<MigrateCoverageReportsEndpointData, any>({
      path: `/routes/test-migration/coverage-reports`,
      method: "POST",
      ...params,
    });

  /**
   * @description Start a new test run
   *
   * @tags Testing, dbtn/module:test_runner
   * @name start_test_run
   * @summary Start Test Run
   * @request POST:/routes/test-runner/run
   */
  start_test_run = (data: AppApisTestRunnerTestRunRequest, params: RequestParams = {}) =>
    this.request<StartTestRunData, StartTestRunError>({
      path: `/routes/test-runner/run`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get the status of a test run
   *
   * @tags Testing, dbtn/module:test_runner
   * @name get_test_status
   * @summary Get Test Status
   * @request GET:/routes/test-runner/status/{run_id}
   */
  get_test_status = ({ runId, ...query }: GetTestStatusParams, params: RequestParams = {}) =>
    this.request<GetTestStatusData, GetTestStatusError>({
      path: `/routes/test-runner/status/${runId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get the detailed results of a test run
   *
   * @tags Testing, dbtn/module:test_runner
   * @name get_test_results
   * @summary Get Test Results
   * @request GET:/routes/test-runner/results/{run_id}
   */
  get_test_results = ({ runId, ...query }: GetTestResultsParams, params: RequestParams = {}) =>
    this.request<GetTestResultsData, GetTestResultsError>({
      path: `/routes/test-runner/results/${runId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Delete a test run and its results
   *
   * @tags Testing, dbtn/module:test_runner
   * @name delete_test_run
   * @summary Delete Test Run
   * @request DELETE:/routes/test-runner/run/{run_id}
   */
  delete_test_run = ({ runId, ...query }: DeleteTestRunParams, params: RequestParams = {}) =>
    this.request<DeleteTestRunData, DeleteTestRunError>({
      path: `/routes/test-runner/run/${runId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Health check endpoint for the test runner
   *
   * @tags Testing, dbtn/module:test_runner
   * @name health_check
   * @summary Health Check
   * @request GET:/routes/test-runner/health
   */
  health_check = (params: RequestParams = {}) =>
    this.request<HealthCheckData, any>({
      path: `/routes/test-runner/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Generate a test coverage report
   *
   * @tags Testing, dbtn/module:test_coverage
   * @name generate_coverage_report
   * @summary Generate Coverage Report
   * @request POST:/routes/test-coverage/generate
   */
  generate_coverage_report = (data: CoverageReportRequest, params: RequestParams = {}) =>
    this.request<GenerateCoverageReportData, GenerateCoverageReportError>({
      path: `/routes/test-coverage/generate`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get a specific coverage report by ID
   *
   * @tags Testing, dbtn/module:test_coverage
   * @name get_coverage_report
   * @summary Get Coverage Report
   * @request GET:/routes/test-coverage/report/{report_id}
   */
  get_coverage_report = ({ reportId, ...query }: GetCoverageReportParams, params: RequestParams = {}) =>
    this.request<GetCoverageReportData, GetCoverageReportError>({
      path: `/routes/test-coverage/report/${reportId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get the latest test coverage information
   *
   * @tags Testing, dbtn/module:test_coverage
   * @name get_latest_coverage
   * @summary Get Latest Coverage
   * @request GET:/routes/test-coverage/latest
   */
  get_latest_coverage = (params: RequestParams = {}) =>
    this.request<GetLatestCoverageData, any>({
      path: `/routes/test-coverage/latest`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get features that are missing test coverage
   *
   * @tags Testing, dbtn/module:test_coverage
   * @name get_missing_features
   * @summary Get Missing Features
   * @request GET:/routes/test-coverage/missing-features
   */
  get_missing_features = (params: RequestParams = {}) =>
    this.request<GetMissingFeaturesData, any>({
      path: `/routes/test-coverage/missing-features`,
      method: "GET",
      ...params,
    });

  /**
   * @description Mark a feature as covered by tests
   *
   * @tags Testing, dbtn/module:test_coverage
   * @name mark_feature_covered
   * @summary Mark Feature Covered
   * @request PUT:/routes/test-coverage/mark-covered
   */
  mark_feature_covered = (query: MarkFeatureCoveredParams, params: RequestParams = {}) =>
    this.request<MarkFeatureCoveredData, MarkFeatureCoveredError>({
      path: `/routes/test-coverage/mark-covered`,
      method: "PUT",
      query: query,
      ...params,
    });

  /**
   * @description Get a summary of test coverage for dashboard display
   *
   * @tags Testing, dbtn/module:test_coverage
   * @name get_coverage_summary
   * @summary Get Coverage Summary
   * @request GET:/routes/test-coverage/summary
   */
  get_coverage_summary = (params: RequestParams = {}) =>
    this.request<GetCoverageSummaryData, any>({
      path: `/routes/test-coverage/summary`,
      method: "GET",
      ...params,
    });

  /**
   * @description Validate that all system components are properly configured and working
   *
   * @tags Testing, dbtn/module:validation
   * @name validate_fixes
   * @summary Validate Fixes
   * @request POST:/routes/validation/
   */
  validate_fixes = (data: ValidateFixesPayload, params: RequestParams = {}) =>
    this.request<ValidateFixesData, ValidateFixesError>({
      path: `/routes/validation/`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get documentation on development rules
   *
   * @tags dbtn/module:documentation
   * @name get_development_rules
   * @summary Get Development Rules
   * @request GET:/routes/rules
   */
  get_development_rules = (params: RequestParams = {}) =>
    this.request<GetDevelopmentRulesData, any>({
      path: `/routes/rules`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get documentation on technical constraints
   *
   * @tags dbtn/module:documentation
   * @name get_technical_constraints
   * @summary Get Technical Constraints
   * @request GET:/routes/constraints
   */
  get_technical_constraints = (params: RequestParams = {}) =>
    this.request<GetTechnicalConstraintsData, any>({
      path: `/routes/constraints`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get documentation on how to migrate storage to Supabase
   *
   * @tags dbtn/module:documentation
   * @name get_migration_docs22
   * @summary Get Migration Docs2
   * @request GET:/routes/migration-docs2
   * @originalName get_migration_docs2
   * @duplicate
   */
  get_migration_docs22 = (params: RequestParams = {}) =>
    this.request<GetMigrationDocs22Data, any>({
      path: `/routes/migration-docs2`,
      method: "GET",
      ...params,
    });

  /**
   * @description Returns comprehensive documentation about the subscription flow for users
   *
   * @tags dbtn/module:documentation
   * @name get_subscription_documentation
   * @summary Get Subscription Documentation
   * @request GET:/routes/subscription-flow
   */
  get_subscription_documentation = (params: RequestParams = {}) =>
    this.request<GetSubscriptionDocumentationData, any>({
      path: `/routes/subscription-flow`,
      method: "GET",
      ...params,
    });

  /**
   * @description Creates a Stripe Checkout Session for the selected price ID and user.
   *
   * @tags dbtn/module:stripe_api
   * @name create_checkout_session
   * @summary Create Checkout Session
   * @request POST:/routes/create-checkout-session
   */
  create_checkout_session = (data: CreateCheckoutSessionRequest, params: RequestParams = {}) =>
    this.request<CreateCheckoutSessionData, CreateCheckoutSessionError>({
      path: `/routes/create-checkout-session`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Handles incoming webhook events from Stripe.
   *
   * @tags dbtn/module:stripe_api
   * @name stripe_webhook
   * @summary Stripe Webhook
   * @request POST:/routes/stripe-webhook
   */
  stripe_webhook = (params: RequestParams = {}) =>
    this.request<StripeWebhookData, StripeWebhookError>({
      path: `/routes/stripe-webhook`,
      method: "POST",
      ...params,
    });

  /**
   * @description Admin endpoint to manually update a user's subscription tier. This is useful for fixing subscription tiers that were not properly updated. Args: user_id: The Supabase user ID tier: The subscription tier (free, pro, premium)
   *
   * @tags Admin, dbtn/module:stripe_api
   * @name admin_fix_subscription
   * @summary Admin Fix Subscription
   * @request POST:/routes/admin/fix-subscription
   */
  admin_fix_subscription = (query: AdminFixSubscriptionParams, params: RequestParams = {}) =>
    this.request<AdminFixSubscriptionData, AdminFixSubscriptionError>({
      path: `/routes/admin/fix-subscription`,
      method: "POST",
      query: query,
      ...params,
    });
}
