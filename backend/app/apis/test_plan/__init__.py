# Test Plan Documentation
from fastapi import APIRouter, Request
from pydantic import BaseModel
from typing import Dict, List, Any, Optional
import json

# Create router
router = APIRouter(prefix="/test-plan", tags=["Testing"])

# Models
class TestStep(BaseModel):
    name: str
    description: str
    instructions: List[str]
    expected_results: List[str]
    tools_required: Optional[List[str]] = None

class TestCase(BaseModel):
    id: str
    title: str
    description: str
    prerequisites: List[str]
    steps: List[TestStep]
    expected_outcome: str
    severity: str = "high"  # high, medium, low

class TestPlan(BaseModel):
    title: str
    version: str
    description: str
    sections: List[Dict[str, Any]]
    test_cases: List[TestCase]

# Define the test plan
test_plan = TestPlan(
    title="Munymo End-to-End Test Plan",
    version="1.0",
    description="Comprehensive test plan for Munymo app covering all critical flows",
    sections=[
        {
            "title": "Authentication & User Management",
            "description": "Tests related to user registration, login, and account management"
        },
        {
            "title": "Game Flow",
            "description": "Tests for the core game loop including discovery, prediction, and results"
        },
        {
            "title": "Subscription & Payment",
            "description": "Tests for subscription plan purchase and management"
        },
        {
            "title": "Notifications",
            "description": "Tests for the push notification system"
        },
        {
            "title": "Leaderboard & Scoring",
            "description": "Tests for the scoring system and leaderboard functionality"
        }
    ],
    test_cases=[
        # Authentication & User Management
        TestCase(
            id="AUTH-001",
            title="User Registration Process",
            description="Test the complete user registration flow",
            prerequisites=["Test environment with Supabase access"],
            steps=[
                TestStep(
                    name="Generate test user",
                    description="Create unique credentials for testing",
                    instructions=[
                        "Navigate to the TestPage",
                        "Use the Signup tab to create a new test user",
                        "Ensure email and username are unique"
                    ],
                    expected_results=[
                        "Success message confirms user creation",
                        "User ID is returned and stored for future tests"
                    ],
                    tools_required=["TestingPanel"]
                ),
                TestStep(
                    name="Verify profile creation",
                    description="Confirm profile record was created in database",
                    instructions=[
                        "Examine the test results JSON",
                        "Confirm profile_created field is true"
                    ],
                    expected_results=[
                        "Profile data is shown in the test results",
                        "Profile includes default subscription tier 'free'"
                    ]
                )
            ],
            expected_outcome="A complete user account is created and ready for testing",
            severity="high"
        ),
        
        # Game Flow
        TestCase(
            id="GAME-001",
            title="Daily Game Discovery",
            description="Test the retrieval and display of the daily prediction game",
            prerequisites=["Authenticated user", "Sandbox mode enabled"],
            steps=[
                TestStep(
                    name="Set sandbox game",
                    description="Configure a specific game for testing",
                    instructions=[
                        "Access the SandboxControls panel",
                        "Enter a valid game ID or use auto-generated one",
                        "Click 'Set ID' to configure the test game"
                    ],
                    expected_results=[
                        "Success toast appears",
                        "Current Game ID is updated in the status display"
                    ],
                    tools_required=["SandboxControls"]
                ),
                TestStep(
                    name="Load game data",
                    description="Verify game data is properly displayed",
                    instructions=[
                        "Navigate to the PredictionGamePage",
                        "Observe the company information and charts"
                    ],
                    expected_results=[
                        "Both companies are displayed with correct information",
                        "Stock charts are visible for both companies",
                        "Prediction submission controls are enabled"
                    ]
                )
            ],
            expected_outcome="The game data is properly retrieved and displayed to the user",
            severity="high"
        ),
        TestCase(
            id="GAME-002",
            title="Prediction Submission",
            description="Test submitting a prediction for the daily game",
            prerequisites=["Authenticated user", "Active game in sandbox mode"],
            steps=[
                TestStep(
                    name="Make prediction",
                    description="Submit a prediction for which company will perform better",
                    instructions=[
                        "On the PredictionGamePage, select either Company A or Company B",
                        "Enter confidence level (if applicable)",
                        "Submit the prediction"
                    ],
                    expected_results=[
                        "Success toast appears",
                        "Prediction is recorded in the database",
                        "UI updates to show prediction has been made"
                    ]
                ),
                TestStep(
                    name="Verify prediction storage",
                    description="Confirm the prediction was properly stored",
                    instructions=[
                        "Check the Supabase predictions table (if access available)",
                        "Or use admin view to confirm prediction exists"
                    ],
                    expected_results=[
                        "Prediction record exists with correct user ID, game ID, and selection"
                    ]
                )
            ],
            expected_outcome="User's prediction is correctly recorded and acknowledged",
            severity="high"
        ),
        TestCase(
            id="GAME-003",
            title="Results Processing",
            description="Test the game results calculation and display",
            prerequisites=["Authenticated user", "Active game with prediction in sandbox mode"],
            steps=[
                TestStep(
                    name="Close predictions",
                    description="Trigger the close of the prediction window",
                    instructions=[
                        "In SandboxControls, click 'Trigger Close Predictions'"
                    ],
                    expected_results=[
                        "Success toast appears",
                        "Game status is updated to 'closed'"
                    ],
                    tools_required=["SandboxControls"]
                ),
                TestStep(
                    name="Process results",
                    description="Trigger the processing of game results",
                    instructions=[
                        "In SandboxControls, click 'Trigger Process Results'"
                    ],
                    expected_results=[
                        "Success toast appears",
                        "Results are calculated and stored"
                    ],
                    tools_required=["SandboxControls"]
                ),
                TestStep(
                    name="View results",
                    description="Check the results display",
                    instructions=[
                        "Navigate to the results page or view",
                        "Review the displayed outcome"
                    ],
                    expected_results=[
                        "Correct winning company is displayed",
                        "User's prediction result (correct/incorrect) is shown",
                        "Points earned are displayed"
                    ]
                )
            ],
            expected_outcome="Game results are properly calculated and displayed to the user",
            severity="high"
        ),
        
        # Leaderboard & Scoring
        TestCase(
            id="SCORE-001",
            title="Leaderboard Update",
            description="Test the updating of the leaderboard after results processing",
            prerequisites=["Completed game with processed results"],
            steps=[
                TestStep(
                    name="Trigger leaderboard update",
                    description="Force a leaderboard recalculation",
                    instructions=[
                        "In SandboxControls, click 'Trigger Leaderboard Update'"
                    ],
                    expected_results=[
                        "Success toast appears",
                        "Leaderboard data is recalculated"
                    ],
                    tools_required=["SandboxControls"]
                ),
                TestStep(
                    name="View leaderboard",
                    description="Check the leaderboard display",
                    instructions=[
                        "Navigate to the leaderboard page",
                        "Look for the test user in the rankings"
                    ],
                    expected_results=[
                        "Leaderboard displays with current rankings",
                        "Test user appears with correct score"
                    ]
                ),
                TestStep(
                    name="Verify MunyIQ score",
                    description="Confirm the user's MunyIQ score has been updated",
                    instructions=[
                        "View user profile or score display",
                        "Check the MunyIQ score value"
                    ],
                    expected_results=[
                        "MunyIQ score reflects the prediction outcome",
                        "Score history shows the recent change"
                    ]
                )
            ],
            expected_outcome="Leaderboard and user scores are correctly updated after game results",
            severity="medium"
        ),
        
        # Subscription & Payment
        TestCase(
            id="SUB-001",
            title="Subscription Purchase Flow",
            description="Test the process of purchasing a subscription plan",
            prerequisites=["Authenticated user with free tier"],
            steps=[
                TestStep(
                    name="Initiate subscription purchase",
                    description="Start the checkout process for a paid plan",
                    instructions=[
                        "Navigate to pricing or subscription page",
                        "Select a premium plan",
                        "Click the purchase/subscribe button"
                    ],
                    expected_results=[
                        "Checkout session is created",
                        "User is redirected to payment page (or simulation in test)"
                    ]
                ),
                TestStep(
                    name="Simulate payment completion",
                    description="Test successful payment flow",
                    instructions=[
                        "For testing, trigger a webhook with success status",
                        "Or use the admin panel to update subscription status"
                    ],
                    expected_results=[
                        "User's subscription tier is updated",
                        "Premium features are unlocked"
                    ]
                )
            ],
            expected_outcome="User can successfully purchase a subscription and gain premium access",
            severity="high"
        ),
        
        # Notifications
        TestCase(
            id="NOTIF-001",
            title="Notification Delivery",
            description="Test the push notification system",
            prerequisites=["Authenticated user", "Device registered for notifications"],
            steps=[
                TestStep(
                    name="Register test device",
                    description="Set up a test device for notification testing",
                    instructions=[
                        "Navigate to the TestPage",
                        "Use the Notification tab to register a test device",
                        "Specify the user ID and browser type"
                    ],
                    expected_results=[
                        "Success message confirms device registration",
                        "Device appears in the test results"
                    ],
                    tools_required=["TestingPanel"]
                ),
                TestStep(
                    name="Test notification delivery",
                    description="Send a test notification to the registered device",
                    instructions=[
                        "Select notification category",
                        "Trigger the test notification"
                    ],
                    expected_results=[
                        "Success message indicates notification would be delivered",
                        "Delivery details are shown in the test results"
                    ]
                ),
                TestStep(
                    name="Test multi-device support",
                    description="Verify notifications can be sent to multiple devices",
                    instructions=[
                        "Use the Multi-Device tab to create several test devices",
                        "Specify the user ID and number of devices"
                    ],
                    expected_results=[
                        "Success message confirms multiple devices created",
                        "Test results show all devices would receive notifications"
                    ]
                )
            ],
            expected_outcome="Notifications are properly delivered to all registered user devices",
            severity="medium"
        )
    ]
)

# Add the root endpoint back
@router.get("/")
async def get_test_plan():
    """Retrieve the comprehensive testing plan"""
    return test_plan

# Add specific endpoint for database testing plan
@router.get("/database")
async def get_database_test_plan():
    """Get the specific database integration test plan"""
    db_test_case = next((tc for tc in test_plan.test_cases if tc.id.startswith("GAME-")), None)
    db_test_cases = [tc for tc in test_plan.test_cases if tc.id.startswith("GAME-")]
    
    database_focused_plan = TestPlan(
        title="Munymo Database Integration Test Plan",
        version="1.0.1",
        description="Tests focused on database interactions and data integrity",
        sections=[
            {
                "title": "Daily Game Data Retrieval",
                "description": "Tests for the get_daily_prediction_pair endpoint and related flows"
            },
            {
                "title": "Game Data Processing",
                "description": "Tests for game creation, submission and results processing"
            },
            {
                "title": "Schema Validation",
                "description": "Tests to verify database schema integrity"
            }
        ],
        test_cases=db_test_cases
    )
    
    return database_focused_plan

# Add specific endpoint for payment testing plan
@router.get("/payment")
async def get_payment_test_plan():
    """Get the specific payment processing test plan"""
    payment_test_cases = [tc for tc in test_plan.test_cases if tc.id.startswith("SUB-")]
    
    payment_focused_plan = TestPlan(
        title="Munymo Payment Processing Test Plan",
        version="1.0.1",
        description="Tests focused on subscription and payment processing",
        sections=[
            {
                "title": "Subscription Purchase",
                "description": "Tests for the subscription purchase flow"
            },
            {
                "title": "Subscription Management",
                "description": "Tests for managing, updating and cancelling subscriptions"
            },
            {
                "title": "Payment Failure Handling",
                "description": "Tests for handling payment failures and recovery"
            }
        ],
        test_cases=payment_test_cases
    )
    
    return payment_focused_plan

# Additional detailed payment test plan with specific payment-focused tests
@router.get("/payment-detailed")
async def get_detailed_payment_test_plan():
    """Get a comprehensive payment processing test plan with specific payment-focused tests"""
    # Step definitions
    class DetailedTestStep(BaseModel):
        id: str
        description: str
        expected_result: str
        critical: bool = False
        automated: bool = False
        implemented: bool = False
        notes: Optional[str] = None

    class DetailedTestScenario(BaseModel):
        id: str
        name: str
        description: str
        steps: List[DetailedTestStep]
        setup_required: Optional[str] = None
        teardown_required: Optional[str] = None

    class DetailedTestPlan(BaseModel):
        name: str
        description: str
        scenarios: List[DetailedTestScenario]
        version: str

    # Define the payment test plan
    payment_test_plan = DetailedTestPlan(
        name="Payment Processing Test Plan",
        description="Comprehensive test plan for the Munymo payment and subscription flows",
        version="1.0.0",
        scenarios=[
            DetailedTestScenario(
                id="TP-1",
                name="Subscription Purchase Flow",
                description="Test the complete flow for purchasing a subscription",
                steps=[
                    DetailedTestStep(
                        id="TP-1-1",
                        description="Navigate to the subscription page as a free user",
                        expected_result="Subscription options are displayed with Pro and Premium tiers",
                        critical=True,
                        automated=False,
                        implemented=True
                    ),
                    DetailedTestStep(
                        id="TP-1-2",
                        description="Select a subscription tier and billing frequency",
                        expected_result="Selection is highlighted and checkout button is enabled",
                        critical=True,
                        automated=False,
                        implemented=True
                    ),
                    DetailedTestStep(
                        id="TP-1-3",
                        description="Click the checkout button",
                        expected_result="Stripe checkout session is created and user is redirected to Stripe checkout",
                        critical=True,
                        automated=True,
                        implemented=True
                    ),
                    DetailedTestStep(
                        id="TP-1-4",
                        description="Complete the checkout process with a test card",
                        expected_result="Payment is processed and user is redirected to success page",
                        critical=True,
                        automated=True,
                        implemented=True,
                        notes="Use Stripe test card 4242 4242 4242 4242"
                    ),
                    DetailedTestStep(
                        id="TP-1-5",
                        description="Verify subscription status in user profile",
                        expected_result="User profile shows correct subscription tier and status",
                        critical=True,
                        automated=True,
                        implemented=True
                    ),
                    DetailedTestStep(
                        id="TP-1-6",
                        description="Verify Stripe webhook handling",
                        expected_result="Subscription events are properly processed and database is updated",
                        critical=True,
                        automated=True,
                        implemented=True,
                        notes="Test both checkout.session.completed and customer.subscription.updated events"
                    )
                ]
            ),
            DetailedTestScenario(
                id="TP-2",
                name="Subscription Management Flow",
                description="Test the user's ability to manage their subscription",
                steps=[
                    DetailedTestStep(
                        id="TP-2-1",
                        description="Navigate to subscription management page as a subscribed user",
                        expected_result="Current subscription details are displayed with management options",
                        critical=True,
                        automated=False,
                        implemented=True
                    ),
                    DetailedTestStep(
                        id="TP-2-2",
                        description="Cancel subscription",
                        expected_result="Cancellation confirmation is shown and subscription is marked for cancellation at period end",
                        critical=True,
                        automated=True,
                        implemented=True
                    ),
                    DetailedTestStep(
                        id="TP-2-3",
                        description="Verify subscription status after cancellation",
                        expected_result="Subscription shows as 'Canceled' with end date",
                        critical=True,
                        automated=True,
                        implemented=True
                    ),
                    DetailedTestStep(
                        id="TP-2-4",
                        description="Reactivate canceled subscription before period end",
                        expected_result="Subscription is reactivated and shows as active again",
                        critical=False,
                        automated=True,
                        implemented=True
                    ),
                    DetailedTestStep(
                        id="TP-2-5",
                        description="Upgrade subscription tier",
                        expected_result="User is billed for upgrade and subscription is updated immediately",
                        critical=True,
                        automated=True,
                        implemented=True
                    ),
                    DetailedTestStep(
                        id="TP-2-6",
                        description="Downgrade subscription tier",
                        expected_result="Downgrade is scheduled for next billing period",
                        critical=True,
                        automated=True,
                        implemented=True
                    )
                ]
            ),
            DetailedTestScenario(
                id="TP-3",
                name="Payment Failure Handling",
                description="Test handling of payment failures and subscription recovery",
                steps=[
                    DetailedTestStep(
                        id="TP-3-1",
                        description="Simulate failed payment with Stripe test card",
                        expected_result="Payment failure is logged and user is notified",
                        critical=True,
                        automated=True,
                        implemented=True,
                        notes="Use Stripe test card 4000 0000 0000 0341"
                    ),
                    DetailedTestStep(
                        id="TP-3-2",
                        description="Verify subscription status after payment failure",
                        expected_result="Subscription shows as 'Past due' or similar status",
                        critical=True,
                        automated=True,
                        implemented=True
                    ),
                    DetailedTestStep(
                        id="TP-3-3",
                        description="Update payment method with valid card",
                        expected_result="Payment method is updated and next payment attempt succeeds",
                        critical=True,
                        automated=True,
                        implemented=True
                    ),
                    DetailedTestStep(
                        id="TP-3-4",
                        description="Verify subscription recovery after payment method update",
                        expected_result="Subscription returns to 'Active' status",
                        critical=True,
                        automated=True,
                        implemented=True
                    )
                ]
            ),
            DetailedTestScenario(
                id="TP-4",
                name="Subscription Billing Tests",
                description="Test subscription billing logic and renewal processes",
                steps=[
                    DetailedTestStep(
                        id="TP-4-1",
                        description="Create subscription with test clock in Stripe",
                        expected_result="Subscription is created with specified start date",
                        critical=True,
                        automated=True,
                        implemented=True,
                        notes="Uses Stripe test clock feature for simulating time progression"
                    ),
                    DetailedTestStep(
                        id="TP-4-2",
                        description="Advance test clock to next billing period",
                        expected_result="Subscription is renewed and new invoice is generated",
                        critical=True,
                        automated=True,
                        implemented=True
                    ),
                    DetailedTestStep(
                        id="TP-4-3",
                        description="Verify webhook processing for renewal",
                        expected_result="Subscription period is updated in database",
                        critical=True,
                        automated=True,
                        implemented=True
                    ),
                    DetailedTestStep(
                        id="TP-4-4",
                        description="Test proration for mid-period upgrades",
                        expected_result="User is correctly charged prorated amount for remainder of billing period",
                        critical=False,
                        automated=True,
                        implemented=True
                    )
                ]
            ),
            DetailedTestScenario(
                id="TP-5",
                name="Fallback and Recovery Tests",
                description="Test system recovery mechanisms for subscription data",
                steps=[
                    DetailedTestStep(
                        id="TP-5-1",
                        description="Simulate webhook failure during subscription creation",
                        expected_result="System detects missing webhook and recovers subscription data",
                        critical=True,
                        automated=True,
                        implemented=False,
                        notes="Requires implementing a webhook verification and recovery process"
                    ),
                    DetailedTestStep(
                        id="TP-5-2",
                        description="Test admin subscription override",
                        expected_result="Admin can manually update user subscription tier and status",
                        critical=True,
                        automated=True,
                        implemented=True
                    ),
                    DetailedTestStep(
                        id="TP-5-3",
                        description="Verify subscription data consistency between Stripe and database",
                        expected_result="Subscription data is consistent across systems",
                        critical=True,
                        automated=True,
                        implemented=False,
                        notes="Requires implementing a reconciliation process"
                    )
                ]
            )
        ]
    )

    return payment_test_plan

# Define a detailed database test plan
@router.get("/database-detailed")
async def get_detailed_database_test_plan():
    """Get a comprehensive database integration test plan with specific database-focused tests"""
    # Use same models as payment detailed plan
    class DetailedTestStep(BaseModel):
        id: str
        description: str
        expected_result: str
        critical: bool = False
        automated: bool = False
        implemented: bool = False
        notes: Optional[str] = None

    class DetailedTestScenario(BaseModel):
        id: str
        name: str
        description: str
        steps: List[DetailedTestStep]
        setup_required: Optional[str] = None
        teardown_required: Optional[str] = None

    class DetailedTestPlan(BaseModel):
        name: str
        description: str
        scenarios: List[DetailedTestScenario]
        version: str

    # Define the database test plan
    database_test_plan = DetailedTestPlan(
        name="Database Integration Test Plan",
        description="Comprehensive test plan for database interactions and schema validation",
        version="1.0.0",
        scenarios=[
            DetailedTestScenario(
                id="DB-1",
                name="Daily Prediction Data Retrieval",
                description="Test the retrieval of daily prediction game data",
                steps=[
                    DetailedTestStep(
                        id="DB-1-1",
                        description="Initialize test database with sample game data",
                        expected_result="Test data is properly inserted into database",
                        critical=True,
                        automated=True,
                        implemented=True
                    ),
                    DetailedTestStep(
                        id="DB-1-2",
                        description="Call get_daily_prediction_pair endpoint",
                        expected_result="Endpoint returns valid game data matching expected schema",
                        critical=True,
                        automated=True,
                        implemented=True
                    ),
                    DetailedTestStep(
                        id="DB-1-3",
                        description="Test with empty database",
                        expected_result="Endpoint gracefully handles missing data with appropriate error",
                        critical=True,
                        automated=True,
                        implemented=True,
                        notes="Should return 404 with informative message, not 500"
                    ),
                    DetailedTestStep(
                        id="DB-1-4",
                        description="Test with malformed database entries",
                        expected_result="Endpoint handles schema inconsistencies gracefully",
                        critical=True,
                        automated=True,
                        implemented=True,
                        notes="Should return valid response or appropriate error, not 500"
                    )
                ]
            ),
            DetailedTestScenario(
                id="DB-2",
                name="User Profile Management",
                description="Test the creation, retrieval and updating of user profiles",
                steps=[
                    DetailedTestStep(
                        id="DB-2-1",
                        description="Create new user via auth system",
                        expected_result="User profile is automatically created in profiles table",
                        critical=True,
                        automated=True,
                        implemented=True
                    ),
                    DetailedTestStep(
                        id="DB-2-2",
                        description="Update user profile with subscription data",
                        expected_result="Profile is updated with subscription tier and customer ID",
                        critical=True,
                        automated=True,
                        implemented=True
                    ),
                    DetailedTestStep(
                        id="DB-2-3",
                        description="Test profile data consistency with auth metadata",
                        expected_result="Profile data matches auth metadata for subscription tier",
                        critical=True,
                        automated=True,
                        implemented=True
                    )
                ]
            ),
            DetailedTestScenario(
                id="DB-3",
                name="Game Submission Flow",
                description="Test the submission of game predictions and results processing",
                steps=[
                    DetailedTestStep(
                        id="DB-3-1",
                        description="Submit prediction for current game",
                        expected_result="Prediction is stored in database with correct user ID and timestamp",
                        critical=True,
                        automated=True,
                        implemented=True
                    ),
                    DetailedTestStep(
                        id="DB-3-2",
                        description="Process game results",
                        expected_result="Results are calculated correctly and stored in database",
                        critical=True,
                        automated=True,
                        implemented=True
                    ),
                    DetailedTestStep(
                        id="DB-3-3",
                        description="Test leaderboard calculation",
                        expected_result="Leaderboard reflects correct user rankings based on results",
                        critical=True,
                        automated=True,
                        implemented=True
                    )
                ]
            )
        ]
    )

    return database_test_plan

# Define the end-to-end test plan with more comprehensive tests
@router.get("/e2e-comprehensive")
async def get_comprehensive_e2e_test_plan():
    """Get the end-to-end test plan with all test cases across areas"""
    # Combine all test plans into one comprehensive plan with full test coverage
    class E2ETestPlan(BaseModel):
        title: str
        description: str
        areas: List[Dict[str, Any]]
        database_tests: Any
        payment_tests: Any
        auth_tests: Any
        game_flow_tests: Any
        notification_tests: Any
        version: str
    
    # Create area-specific test references
    auth_test_cases = [tc for tc in test_plan.test_cases if tc.id.startswith("AUTH-")]
    game_test_cases = [tc for tc in test_plan.test_cases if tc.id.startswith("GAME-")]
    score_test_cases = [tc for tc in test_plan.test_cases if tc.id.startswith("SCORE-")]
    subscription_test_cases = [tc for tc in test_plan.test_cases if tc.id.startswith("SUB-")]
    notification_test_cases = [tc for tc in test_plan.test_cases if tc.id.startswith("NOTIF-")]
    
    comprehensive_plan = E2ETestPlan(
        title="Munymo Comprehensive E2E Test Suite",
        description="Complete test coverage for all Munymo app systems and integrations",
        version="1.0.2",
        areas=[
            {
                "name": "Database",
                "critical": True,
                "test_count": len(game_test_cases),
                "description": "Tests for database schema, queries, and data integrity"
            },
            {
                "name": "Authentication",
                "critical": True,
                "test_count": len(auth_test_cases),
                "description": "Tests for user authentication and authorization"
            },
            {
                "name": "Payment Processing",
                "critical": True,
                "test_count": len(subscription_test_cases),
                "description": "Tests for subscription management and payment processing"
            },
            {
                "name": "Game Flow",
                "critical": True,
                "test_count": len(game_test_cases),
                "description": "Tests for the core game mechanics and user interactions"
            },
            {
                "name": "Notifications",
                "critical": False,
                "test_count": len(notification_test_cases),
                "description": "Tests for push notification delivery and handling"
            },
            {
                "name": "Scoring & Leaderboard",
                "critical": True,
                "test_count": len(score_test_cases),
                "description": "Tests for score calculation and leaderboard functionality"
            }
        ],
        database_tests={
            "test_cases": game_test_cases,
            "priority": "highest",
            "suggested_execution_order": 1,
            "rationale": "Database tests must be run first to ensure data integrity for all other tests"
        },
        payment_tests={
            "test_cases": subscription_test_cases,
            "priority": "high",
            "suggested_execution_order": 3,
            "rationale": "Payment tests require authenticated users but should be run before game flow tests"
        },
        auth_tests={
            "test_cases": auth_test_cases,
            "priority": "highest",
            "suggested_execution_order": 2,
            "rationale": "Authentication tests should run early as many other tests depend on authenticated users"
        },
        game_flow_tests={
            "test_cases": game_test_cases + score_test_cases,
            "priority": "high",
            "suggested_execution_order": 4,
            "rationale": "Game flow tests exercise the core functionality and should run after auth and payment tests"
        },
        notification_tests={
            "test_cases": notification_test_cases,
            "priority": "medium",
            "suggested_execution_order": 5,
            "rationale": "Notification tests are less critical and can run last in the test sequence"
        }
    )
    
    return comprehensive_plan

