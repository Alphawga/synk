Synk — Product Requirements Document (PRD)
MVP Feature Specifications

1. Overview
1.1 Product Summary
Synk is a unified saved content platform delivered through a Chrome extension and web application. It captures browser tabs with one click, auto-syncs X (Twitter) likes and bookmarks, organizes everything with AI, and enables semantic search across all saved content.
1.2 Problem Statement
Research-heavy professionals save hundreds of browser tabs and thousands of X bookmarks but can never find them again. Content is scattered across silos, manually organizing is unsustainable, search is broken everywhere, and saved content disappears when browsers crash or tweets get deleted.
1.3 Target User
Primary: Research-heavy professionals (marketers, consultants, analysts, content strategists) aged 28-42 who have 25+ browser tabs open daily and 1,000+ unsearchable X bookmarks.
Characteristics:
Knowledge work roles at startups/agencies
Already paying $15-30/month for productivity tools
Active on productivity Twitter
Pain directly impacts work quality


1.4 Success Metrics
Metric
Target
Measurement Method
Extension installs
1,000 in 90 days
Chrome Web Store analytics
Activation rate
60% complete first save
Product analytics
X connection rate
30% of users
Product analytics
Weekly Active Savers
300
Users saving 1+ item/week
D7 retention
40%
Cohort analysis
Search success rate
70%
Item found within 3 searches
Paid conversion
3%
Stripe analytics


2. Goals & Non-Goals
2.1 Goals
Enable effortless capture — Save all browser tabs in under 2 seconds with one click
Unify content sources — Bring browser tabs and X content into single searchable library
Eliminate manual organization — AI categorizes and tags automatically
Make retrieval instant — Find any saved item in under 15 seconds
Ensure permanence — Saved content survives browser crashes and tweet deletions
Validate willingness to pay — Convert 3%+ of free users to paid
2.2 Non-Goals (MVP)
Not building mobile apps — Web app is mobile-responsive but no native apps
Not supporting multiple browsers — Chrome only for MVP
Not building team features — Individual users only
Not building advanced AI features — No summarization, Q&A, or connection finding
Not building integrations — No Notion, Obsidian, Zapier for MVP
Not building social features — No sharing collections publicly

3. User Stories by Epic
Epic 1: Account Management
US-1.1: Account Creation
As a new user
 I want to create an account with Google or email
 So that my saved content syncs across devices and is backed up
Priority: P0 (Must Have)
 Effort: Medium (5 points)
Acceptance Criteria:
gherkin
Scenario: Sign up with Google
  Given I am on the Synk web app login page
  When I click "Continue with Google"
  And I complete Google OAuth flow
  Then I am logged into Synk
  And my account is created
  And I am redirected to onboarding

Scenario: Sign up with email
  Given I am on the Synk web app login page
  When I enter a valid email address
  And I enter a password (min 8 characters)
  And I click "Create Account"
  Then I receive a verification email
  And I can verify my email to activate account

Scenario: Invalid email format
  Given I am on the signup page
  When I enter an invalid email format
  And I click "Create Account"
  Then I see error "Please enter a valid email address"
  And the form is not submitted

Scenario: Password too short
  Given I am on the signup page
  When I enter a password with fewer than 8 characters
  Then I see error "Password must be at least 8 characters"
Design Reference: [Figma: Auth Screens]

US-1.2: Login
As a returning user
 I want to log into my account
 So that I can access my saved content
Priority: P0
 Effort: Small (3 points)
Acceptance Criteria:
gherkin
Scenario: Login with Google
  Given I have an existing Synk account created with Google
  When I click "Continue with Google"
  And I complete Google OAuth
  Then I am logged in
  And I see my dashboard with saved content

Scenario: Login with email/password
  Given I have an existing account
  When I enter my email and correct password
  And I click "Log In"
  Then I am logged in and redirected to dashboard

Scenario: Incorrect password
  Given I have an existing account
  When I enter incorrect password
  And I click "Log In"
  Then I see error "Invalid email or password"
  And I remain on login page

Scenario: Forgot password
  Given I am on the login page
  When I click "Forgot password"
  And I enter my email
  Then I receive a password reset email
  And I can set a new password via the link

US-1.3: Extension Authentication
As a user with the Chrome extension installed
 I want to link the extension to my Synk account
 So that my tab saves sync to my library
Priority: P0
 Effort: Medium (5 points)
Acceptance Criteria:
gherkin
Scenario: Extension prompts login on first use
  Given I have installed the Synk extension
  And I am not logged in
  When I click the extension icon
  Then I see "Sign in to start saving"
  And I see "Sign in with Google" and "Sign in with Email" buttons

Scenario: Login via extension opens web auth
  Given I am viewing the extension popup
  When I click "Sign in with Google"
  Then a new tab opens with Synk web app auth flow
  And after successful auth, the extension popup updates to logged-in state

Scenario: Extension reflects logged-in state
  Given I am logged into Synk web app
  When I click the extension icon
  Then I see my account avatar
  And I see "Save All Tabs" button
  And I see my recent saves

Epic 2: Browser Tab Capture (Chrome Extension)
US-2.1: Save All Tabs
As a user with multiple tabs open
 I want to save all tabs with one click
 So that I can close them and free up memory without losing them
Priority: P0
 Effort: Large (8 points)
Acceptance Criteria:
gherkin
Scenario: Save all tabs via extension popup
  Given I am logged into the extension
  And I have 15 tabs open in current window
  When I click the extension icon
  And I click "Save All Tabs"
  Then all 15 tabs are saved to my Synk library
  And all tabs close except the active tab
  And I see confirmation "15 tabs saved ✓"
  And the tabs appear in my web app dashboard

Scenario: Save all tabs via keyboard shortcut
  Given I am logged into the extension
  And I have tabs open
  When I press Ctrl+Shift+S (or Cmd+Shift+S on Mac)
  Then all tabs are saved
  And tabs close
  And I see toast notification "X tabs saved ✓"

Scenario: Save empty window
  Given I have only one tab open (new tab page)
  When I click "Save All Tabs"
  Then I see message "No tabs to save"
  And no save is created



Scenario: Save with pinned tabs
  Given I have 10 regular tabs and 3 pinned tabs
  When I click "Save All Tabs"
  Then only the 10 regular tabs are saved
  And pinned tabs remain open
  And I see "10 tabs saved (3 pinned tabs kept open)"
Business Rules:
Pinned tabs are excluded from "Save All" by default
New Tab pages (chrome://newtab) are excluded
Chrome system pages (chrome://*) are excluded
Duplicate URLs within same save are deduplicated
Maximum 500 tabs per single save operation
Edge Cases:
Tab still loading → Save URL and title if available, mark as "incomplete"
Tab is a PDF → Save URL, note content type
Tab requires authentication → Save URL only, no content extraction
Error States:
Not logged in → Show "Sign in to save tabs"
Network error → Queue save locally, sync when online, show "Saved offline, will sync"
Save fails → Show "Save failed. Try again?" with retry button

US-2.2: Save Current Tab Only
As a user viewing a specific page
 I want to save just this tab without closing it
 So that I can bookmark it for later while continuing to read
Priority: P1
 Effort: Small (3 points)
Acceptance Criteria:
gherkin
Scenario: Quick save current tab via shortcut
  Given I am viewing a webpage
  When I press Ctrl+Shift+D (Cmd+Shift+D on Mac)
  Then the current tab is saved to my library
  And I see toast "Page saved ✓"
  And the tab remains open

Scenario: Quick save via right-click
  Given I am viewing a webpage
  When I right-click anywhere on the page
  And I select "Save to Synk"
  Then the page is saved
  And I see confirmation toast

Scenario: Save duplicate URL
  Given I have already saved example.com/article
  When I save the same URL again
  Then a new save entry is created (not deduplicated)
  And both entries appear in my library with different timestamps

US-2.3: Selective Tab Save
As a user
 I want to choose which tabs to save
 So that I can save only relevant tabs from a mixed window
Priority: P1
 Effort: Medium (5 points)
Acceptance Criteria:
gherkin
Scenario: Enter selection mode
  Given I click the extension icon
  When I click "Select Tabs"
  Then I see a list of all open tabs with checkboxes
  And all checkboxes are unchecked by default

Scenario: Select and save specific tabs
  Given I am in tab selection mode
  When I check 5 specific tabs
  And I click "Save Selected (5)"
  Then only those 5 tabs are saved
  And those 5 tabs close
  And unchecked tabs remain open

Scenario: Select all in selection mode
  Given I am in tab selection mode
  When I click "Select All"
  Then all tab checkboxes are checked
  And the button shows "Save Selected (X)"

Scenario: Cancel selection
  Given I am in tab selection mode
  When I click "Cancel" or press Escape
  Then I return to normal popup view
  And no tabs are saved

US-2.4: Undo Save
As a user who just saved tabs
 I want to undo the save
 So that I can recover tabs I closed accidentally
Priority: P1
 Effort: Medium (5 points)
Acceptance Criteria:
gherkin
Scenario: Undo save within time window
  Given I just saved 10 tabs
  And I see the confirmation with "Undo" link
  When I click "Undo" within 10 seconds
  Then all 10 tabs reopen in their original positions
  And the save is deleted from my library
  And I see "Save undone. Tabs restored."

Scenario: Undo window expires
  Given I saved tabs 15 seconds ago
  When I look for the Undo option
  Then the confirmation toast has disappeared
  And Undo is no longer available
  And the save is permanent

Scenario: Undo after navigating away
  Given I saved tabs
  And I opened a new tab before clicking Undo
  When I click Undo
  Then tabs restore in a new window
  And I see "Tabs restored in new window"

US-2.5: Extension Popup Quick View
As a user
 I want to see my recent saves in the extension popup
 So that I can quickly access recently saved content
Priority: P1
 Effort: Small (3 points)
Acceptance Criteria:
gherkin
Scenario: View recent saves
  Given I am logged in
  When I click the extension icon
  Then I see my 5 most recent saves
  And each shows: favicon, title (truncated), time saved

Scenario: Open saved item from popup
  Given I see recent saves in popup
  When I click on a save
  Then it opens in a new tab

Scenario: Navigate to full dashboard
  Given I am viewing the extension popup
  When I click "View All Saves" or "Open Dashboard"
  Then the Synk web app opens in a new tab

US-2.6: Extension Search
As a user
 I want to search my library from the extension
 So that I can find content without opening the full web app
Priority: P2
 Effort: Medium (5 points)
Acceptance Criteria:
gherkin
Scenario: Search from extension
  Given I am logged in
  When I type in the search box in extension popup
  Then I see up to 5 matching results
  And results show title, favicon, source badge

Scenario: Open search result
  Given I see search results in popup
  When I click a result
  Then it opens in a new tab

Scenario: No results found
  Given I search for "xyznonexistent"
  When results load
  Then I see "No results found"
  And I see "Search in Web App" link for full search

Scenario: View all results
  Given I see 5 results in popup
  When I click "See all X results"
  Then the web app opens with the same search query

Epic 3: X (Twitter) Integration
US-3.1: Connect X Account
As a user
 I want to connect my X/Twitter account
 So that Synk can import my likes and bookmarks
Priority: P0
 Effort: Large (8 points)
Acceptance Criteria:
gherkin
Scenario: Initiate X connection
  Given I am logged into Synk web app
  When I navigate to Settings > Integrations > X
  And I click "Connect X Account"
  Then I am redirected to X OAuth page

Scenario: Authorize Synk
  Given I am on X OAuth page
  When I review permissions (read-only: likes, bookmarks)
  And I click "Authorize"
  Then I am redirected back to Synk
  And I see "X account connected successfully"
  And my X handle is displayed

Scenario: Decline authorization
  Given I am on X OAuth page
  When I click "Cancel" or close the window
  Then I return to Synk settings
  And I see "X connection cancelled"
  And I can try again

Scenario: Already connected
  Given I have already connected my X account
  When I visit Settings > Integrations > X
  Then I see my connected @handle
  And I see "Disconnect" button
  And I see sync status and last sync time
Business Rules:
Read-only permissions only (cannot post, like, or bookmark via Synk)
OAuth tokens stored securely, encrypted at rest
User can disconnect at any time
One X account per Synk account (MVP)

US-3.2: Import X Likes and Bookmarks
As a user who connected X
 I want to import my existing likes and bookmarks
 So that I can search all my X content in Synk
Priority: P0
 Effort: Large (13 points)
Acceptance Criteria:
gherkin
Scenario: Initial import starts automatically
  Given I just connected my X account
  When connection completes
  Then import begins automatically
  And I see "Importing your X content..."
  And I see progress: "Found X likes and Y bookmarks"

Scenario: Large library import
  Given I have 5,000 likes and 1,000 bookmarks
  When import runs
  Then I see progress bar with estimates
  And I see "This may take a few minutes"
  And I can navigate away and import continues in background
  And I receive notification when complete

Scenario: Import completes
  Given import is running
  When all content is imported
  Then I see "Import complete! X items added"
  And content appears in my library
  And I can search X content immediately

Scenario: Partial import (API limits)
  Given I have more content than API allows in one session
  When import reaches API rate limit
  Then I see "Imported X of Y items. Remaining will sync later."
  And background sync continues when rate limit resets

Scenario: Import with Free tier limits
  Given I am on Free tier (500 item limit)
  And I have 2,000 X items
  When import runs
  Then 500 most recent items are imported
  And I see "500 items imported. Upgrade to Plus for more."
Business Rules:
Import most recent content first
Likes and bookmarks imported separately, tagged by source
Threads detected and grouped
Media (images, videos) URLs stored, thumbnails cached
Author information preserved (handle, display name, avatar URL)
Original tweet URL stored for reference

US-3.3: Ongoing X Sync
As a user with X connected
 I want to have new likes/bookmarks sync automatically
 So that my library stays up to date
Priority: P1
 Effort: Medium (5 points)
Acceptance Criteria:
gherkin
Scenario: Automatic sync (Free tier)
  Given I am on Free tier
  And I have X connected
  When 24 hours pass since last sync
  Then Synk checks for new X content
  And new items are added to my library

Scenario: Automatic sync (Plus tier)
  Given I am on Plus tier
  When 1 hour passes since last sync
  Then Synk checks for new content
  And new items appear within minutes of the hour

Scenario: Manual sync
  Given I want my latest X content now
  When I click "Sync Now" in X settings
  Then sync runs immediately
  And I see "Syncing..." then "Sync complete. X new items."

Scenario: Sync status display
  Given I am viewing my X content
  When I look at the section header
  Then I see "Last synced: X minutes/hours ago"
  And I see "Sync Now" button

US-3.4: View X Content
As a user
 I want to view my X likes and bookmarks in Synk
 So that I can browse and search them
Priority: P0
 Effort: Medium (5 points)
Acceptance Criteria:
gherkin
Scenario: View all X content
  Given I have X content imported
  When I click "X Content" in sidebar
  Then I see all my X likes and bookmarks
  And each item shows: author, text, media preview, source badge (Like/Bookmark)

Scenario: Filter by likes only
  Given I am viewing X content
  When I click "Likes" filter
  Then I see only items I liked (not bookmarked)

Scenario: Filter by bookmarks only
  Given I am viewing X content
  When I click "Bookmarks" filter
  Then I see only items I bookmarked

Scenario: View thread
  Given an item is part of a thread
  When I click on it
  Then I see the full thread expanded
  And all tweets in the thread are displayed in order

Scenario: Open original on X
  Given I am viewing an X item
  When I click "Open in X" or the external link icon
  Then the original tweet opens in a new tab on x.com

US-3.5: Permanent Archive (Deleted Tweet Protection)
As a user
 I want to access content even if the original tweet is deleted
 So that my saved knowledge is never lost
Priority: P1
 Effort: Medium (5 points)
Acceptance Criteria:
gherkin
Scenario: Content preserved after deletion
  Given I saved a tweet that is later deleted from X
  When I view that item in Synk
  Then the full content is still visible
  And I see badge "Original deleted from X"
  And all media that was cached is still viewable

Scenario: Link to deleted content
  Given an item is marked as deleted from X
  When I click "Open in X"
  Then X opens (may show "Tweet unavailable")
  And Synk content remains accessible

Scenario: Detect deleted content
  Given I have X items in my library
  When periodic check runs
  Then items that no longer exist on X are marked "Deleted from X"
  And content and media in Synk are preserved
Business Rules:
Full tweet text stored at time of import
Media files (images) cached locally/CDN
Video thumbnails stored (not full video)
Deletion status checked periodically (daily for free, more often for paid)
Original URL preserved even if content deleted

Epic 4: Content Organization
US-4.1: AI Categorization
As a user
 I want to have my content automatically categorized
 So that I don't have to manually organize everything
Priority: P1
 Effort: Large (8 points)
Acceptance Criteria:
gherkin
Scenario: New save is categorized
  Given I save a tab about "React performance optimization"
  When the save is processed
  Then it is automatically assigned category "Technology"
  And it may have tags like "react", "performance", "javascript"
  And category appears on the item card

Scenario: X content is categorized
  Given a new tweet is imported about "startup fundraising tips"
  When processing completes
  Then it is assigned category "Business"
  And relevant tags are generated

Scenario: View by category
  Given I have content in multiple categories
  When I click a category in the sidebar (e.g., "Technology")
  Then I see only items in that category
  And I can further filter/search within category

Scenario: Recategorize item
  Given an item is categorized as "Technology"
  And I think it should be "Business"
  When I click the category badge
  And I select "Business"
  Then the category updates
  And this feedback improves future categorization
Business Rules:
Categories: Technology, Business, Marketing, Design, Finance, Health, Productivity, Learning, Entertainment, News, Personal, Other
Each item gets exactly one category
Tags are multiple per item (0-5 typically)
Categorization runs async, may take 5-30 seconds after save
Free tier gets basic categorization, Plus/Pro gets enhanced accuracy

US-4.2: Manual Folders
As a user
 I want to create folders to organize my content
 So that I can group items by project or topic
Priority: P1
 Effort: Medium (5 points)
Acceptance Criteria:
gherkin
Scenario: Create folder
  Given I am in the web app
  When I click "+" next to Folders in sidebar
  And I enter folder name "Q1 Research"
  And I press Enter
  Then the folder is created
  And it appears in my sidebar

Scenario: Move item to folder
  Given I have a folder "Q1 Research"
  When I drag an item to the folder
  Or right-click > Move to > Q1 Research
  Then the item appears in that folder
  And the item still appears in All Saves view

Scenario: View folder contents
  Given folder "Q1 Research" has 15 items
  When I click the folder in sidebar
  Then I see all 15 items
  And I can search within the folder

Scenario: Rename folder
  Given I have a folder
  When I right-click > Rename
  And I enter new name
  Then the folder name updates

Scenario: Delete folder
  Given I have a folder with items
  When I right-click > Delete
  Then I see confirmation "Delete folder? Items will be moved to All Saves"
  When I confirm
  Then folder is deleted
  And items remain in library (not deleted)

US-4.3: Bulk Actions
As a user
 I want to perform actions on multiple items at once
 So that I can organize efficiently
Priority: P2
 Effort: Medium (5 points)
Acceptance Criteria:
gherkin
Scenario: Select multiple items
  Given I am viewing my library
  When I click the checkbox on an item
  Then it is selected
  And a selection bar appears at bottom
  And I can click more items to add to selection

Scenario: Select range
  Given I have items in a list
  When I click one item checkbox
  And I shift+click another item checkbox
  Then all items between are selected

Scenario: Bulk move to folder
  Given I have 10 items selected
  When I click "Move to Folder" in selection bar
  And I choose a folder
  Then all 10 items are moved
  And I see "10 items moved to [folder]"

Scenario: Bulk delete
  Given I have items selected
  When I click "Delete" in selection bar
  Then I see confirmation
  When I confirm
  Then all selected items move to Trash

Scenario: Cancel selection
  Given I have items selected
  When I click "Cancel" or press Escape
  Then selection is cleared
  And selection bar disappears

Epic 5: Search & Retrieval
US-5.1: Full-Text Search
As a user
 I want to search across all my saved content
 So that I can find items by keywords
Priority: P0
 Effort: Large (8 points)
Acceptance Criteria:
gherkin
Scenario: Basic keyword search
  Given I have content with the word "productivity"
  When I type "productivity" in search bar
  Then I see all items containing "productivity"
  And matching terms are highlighted in results

Scenario: Search across sources
  Given I have browser tabs and X content
  When I search "startup"
  Then results include both browser saves and X items
  And each result shows source badge (Browser/X Like/X Bookmark)

Scenario: Search tweet text
  Given I have an X item with text "Here's how to raise your seed round"
  When I search "seed round"
  Then that X item appears in results

Scenario: Search page titles
  Given I saved a tab titled "Complete Guide to React Hooks"
  When I search "React Hooks"
  Then that item appears in results

Scenario: No results
  Given I search "xyznonexistent123"
  When results load
  Then I see "No results found"
  And I see suggestions like "Try different keywords"

US-5.2: Source Filtering
As a user
 I want to filter search results by source
 So that I can find content from specific places
Priority: P1
 Effort: Small (3 points)
Acceptance Criteria:
gherkin
Scenario: Filter by browser saves
  Given I am searching
  When I click "Browser" filter pill
  Then only browser tab saves appear in results
  And X content is hidden

Scenario: Filter by X likes
  Given I am searching
  When I click "X Likes" filter
  Then only items from X likes appear

Scenario: Filter by X bookmarks
  Given I am searching
  When I click "X Bookmarks" filter
  Then only items from X bookmarks appear

Scenario: Combine search with filter
  Given I search "productivity"
  And I select "Browser" filter
  Then I see only browser saves matching "productivity"

Scenario: Clear filters
  Given I have filters applied
  When I click "Clear filters" or "All"
  Then all sources are included in results

US-5.3: Search Results Display
As a user
 I want to see useful information in search results
 So that I can identify the right item quickly
Priority: P0
 Effort: Medium (5 points)
Acceptance Criteria:
gherkin
Scenario: Result card information
  Given I have search results
  When I view a result card
  Then I see:
    - Favicon (browser) or author avatar (X)
    - Title or tweet text (truncated with highlights)
    - URL domain or @handle
    - Source badge
    - Category badge
    - Save date

Scenario: Result preview on hover
  Given I am viewing search results
  When I hover over a result for 1 second
  Then I see expanded preview card
  And preview shows full title/text and thumbnail if available

Scenario: Open result
  Given I see a search result
  When I click it
  Then the original URL opens in a new tab

Scenario: Sort results
  Given I have search results
  When I click "Sort by"
  Then I can choose: Relevance, Date (newest), Date (oldest)
  And results reorder accordingly

US-5.4: Semantic Search (Basic)
As a user
 I want to search by meaning, not just keywords
 So that I can find content using natural language
Priority: P2
 Effort: Large (13 points)
Acceptance Criteria:
gherkin
Scenario: Natural language query
  Given I have content about "startup hiring best practices"
  When I search "how to hire engineers"
  Then that content appears in results
  Even though exact keywords don't match

Scenario: Concept matching
  Given I have content about "GTD methodology"
  When I search "productivity systems"
  Then GTD content appears
  Because semantic similarity is recognized

Scenario: Mixed keyword and semantic
  Given semantic search is enabled
  When I search
  Then results combine exact matches (ranked higher) with semantic matches
  And semantic matches are labeled or shown with lower relevance

Scenario: Semantic search indication
  Given I am using semantic search
  When results show semantically-related items
  Then I see indicator "Related to your search"
  To distinguish from exact keyword matches
Note: Semantic search is P2 and may be simplified or deferred based on development time. Basic keyword search (US-5.1) is the MVP foundation.

Epic 6: Dashboard & Library View
US-6.1: Dashboard Home
As a user
 I want to see an overview of my library when I open Synk
 So that I can access content and understand my saves at a glance
Priority: P0
 Effort: Medium (5 points)
Acceptance Criteria:
gherkin
Scenario: Dashboard layout
  Given I am logged in
  When I open the Synk web app
  Then I see:
    - Left sidebar with navigation
    - Top bar with search
    - Main content area with recent saves

Scenario: Sidebar navigation
  Given I am on dashboard
  When I look at the sidebar
  Then I see:
    - All Saves
    - Browser Tabs
    - X Content (with sub-items: Likes, Bookmarks)
    - Categories (expandable)
    - Folders (expandable)
    - Archive
    - Trash

Scenario: Recent saves view
  Given I have saved content
  When I am on "All Saves"
  Then I see content sorted by most recent first
  And I can toggle between Grid and List view

US-6.2: Content Grid/List View
As a user
 I want to view my content in different layouts
 So that I can browse in my preferred style
Priority: P1
 Effort: Small (3 points)
Acceptance Criteria:
gherkin
Scenario: Grid view
  Given I am viewing content
  When I click Grid view icon
  Then items display as cards in a grid
  And each card shows: thumbnail, title, source badge

Scenario: List view
  Given I am viewing content
  When I click List view icon
  Then items display in a compact list
  And each row shows: favicon, title, URL/author, date, source

Scenario: View preference persists
  Given I select List view
  When I navigate away and return
  Then List view is still selected

US-6.3: Item Detail View
As a user
 I want to see full details of a saved item
 So that I can read, categorize, or take action on it
Priority: P1
 Effort: Medium (5 points)
Acceptance Criteria:
gherkin
Scenario: View item details
  Given I am viewing my library
  When I click the "expand" icon on an item (or double-click)
  Then a detail panel/modal opens
  And I see:
    - Full title
    - Full URL (clickable)
    - Thumbnail/preview (if available)
    - Full tweet text (for X content)
    - Category (editable)
    - Tags (editable)
    - Source and date saved
    - Actions: Open, Delete, Move

Scenario: Edit category from detail view
  Given I am viewing item details
  When I click the category badge
  And I select a different category
  Then the category updates immediately

Scenario: Close detail view
  Given detail panel is open
  When I click X or press Escape or click outside
  Then the panel closes
  And I return to library view

Epic 7: Settings & Subscription
US-7.1: Extension Settings
As a user
 I want to configure extension behavior
 So that it works the way I prefer
Priority: P1
 Effort: Small (3 points)
Acceptance Criteria:
gherkin
Scenario: Access extension settings
  Given I click the extension icon
  When I click the gear/settings icon
  Then settings open (in popup or new tab)

Scenario: Configure close behavior
  Given I am in extension settings
  When I toggle "Close tabs after saving"
  Then the setting updates
  And future saves respect this setting

Scenario: Configure pinned tabs
  Given I am in extension settings
  When I toggle "Exclude pinned tabs"
  Then pinned tabs are included/excluded from "Save All"

Scenario: View keyboard shortcuts
  Given I am in extension settings
  When I view Keyboard Shortcuts section
  Then I see current shortcuts
  And I see link to Chrome shortcuts settings to customize

US-7.2: X Sync Settings
As a user
 I want to manage my X connection and sync preferences
 So that I control what content syncs
Priority: P1
 Effort: Small (3 points)
Acceptance Criteria:
gherkin
Scenario: View X connection status
  Given I have X connected
  When I go to Settings > Integrations > X
  Then I see:
    - Connected @handle
    - Last sync time
    - Total items synced
    - Sync Now button
    - Disconnect button

Scenario: Toggle like/bookmark sync
  Given I am in X settings
  When I toggle "Sync Likes" off
  Then future syncs skip likes
  And existing likes remain in library

Scenario: Disconnect X
  Given I want to disconnect X
  When I click "Disconnect"
  Then I see confirmation "Disconnect X? Your synced content will remain."
  When I confirm
  Then X is disconnected
  And existing X content stays in library
  And no future syncs occur

US-7.3: Subscription Management
As a user
 I want to view and manage my subscription
 So that I can upgrade, downgrade, or see my usage
Priority: P0
 Effort: Medium (5 points)
Acceptance Criteria:
gherkin
Scenario: View current plan (Free)
  Given I am on Free tier
  When I go to Settings > Subscription
  Then I see:
    - "Free Plan"
    - Usage: "X of 500 items saved"
    - "Upgrade to Plus" button

Scenario: View current plan (Paid)
  Given I am on Plus tier
  When I go to Settings > Subscription
  Then I see:
    - "Plus Plan - $6/month"
    - Next billing date
    - "Manage Billing" link
    - "Cancel Subscription" option

Scenario: Upgrade to Plus
  Given I am on Free tier
  When I click "Upgrade to Plus"
  Then I see pricing modal
  And I can enter payment info (Stripe)
  And upon success, my plan upgrades immediately

Scenario: Approaching limit
  Given I am on Free tier with 450/500 items
  When I view dashboard
  Then I see banner "You've used 450 of 500 saves. Upgrade for unlimited."

Scenario: At limit
  Given I am at 500/500 items
  When I try to save more
  Then I see "You've reached your save limit. Upgrade to continue saving."
  And the save is blocked

Epic 8: Onboarding
US-8.1: First-Time User Onboarding
As a new user
 I want to be guided through setup
 So that I understand how to use Synk and get value quickly
Priority: P0
 Effort: Medium (5 points)
Acceptance Criteria:
gherkin
Scenario: Onboarding flow starts after signup
  Given I just created my account
  When account creation completes
  Then I see the onboarding wizard
  And I see progress indicator "Step 1 of 3"

Scenario: Step 1 - First save
  Given I am on onboarding step 1
  When I see "Save your first tabs"
  Then I see instructions to click extension or use shortcut
  When I complete a save
  Then step 1 completes
  And I proceed to step 2

Scenario: Step 2 - Connect X (optional)
  Given I completed step 1
  When I see "Connect X account"
  Then I see benefits listed
  And I see "Connect X" button
  And I see "Skip for now" link
  When I connect or skip
  Then I proceed to step 3

Scenario: Step 3 - Explore dashboard
  Given I completed step 2
  When I see "Your library is ready"
  Then I see my saved content
  And I see brief tooltips highlighting key areas
  And I see "Start Exploring" button

Scenario: Skip onboarding
  Given I am in onboarding
  When I click "Skip Tutorial"
  Then onboarding closes
  And I go directly to dashboard

4. Feature Specifications
4.1 Chrome Extension
4.1.1 Description
Browser extension for Chrome that enables one-click tab capture, quick search, and syncs with user's Synk account.
4.1.2 Functional Requirements
ID
Requirement
Priority
EXT-001
Extension popup displays when toolbar icon clicked
P0
EXT-002
Popup shows "Save All Tabs" button when logged in
P0
EXT-003
Popup shows login prompt when not logged in
P0
EXT-004
"Save All Tabs" captures all non-pinned, non-system tabs
P0
EXT-005
Keyboard shortcut Ctrl+Shift+S triggers save all
P0
EXT-006
Keyboard shortcut Ctrl+Shift+D saves current tab only
P1
EXT-007
Tabs close after save (configurable)
P0
EXT-008
Toast notification confirms save with count
P0
EXT-009
Undo option available for 10 seconds after save
P1
EXT-010
Popup shows 5 most recent saves
P1
EXT-011
Search bar in popup searches library
P2
EXT-012
"Open Dashboard" link opens web app
P0
EXT-013
Extension syncs auth state with web app
P0
EXT-014
Offline saves queue and sync when online
P1
EXT-015
Right-click context menu: "Save to Synk"
P1

4.1.3 UI/UX Requirements
Popup width: 350px, height: dynamic (max 500px)
Load time: popup appears within 200ms
Save animation: brief swoosh effect (under 500ms)
Toast notification: bottom-right of browser, auto-dismiss 5s
Color scheme: matches Synk brand (white bg, blue accents)
Responsive to dark mode preference
4.1.4 Edge Cases
Scenario
Handling
500+ tabs open
Warn user, allow save in batches
Tab still loading
Save URL, mark as incomplete
Duplicate URLs in window
Deduplicate in same save session
System pages (chrome://)
Exclude automatically
Extension suspended by browser
Resume on next click
User not logged in
Prompt login, don't lose attempted save


4.2 Web Application
4.2.1 Description
Full-featured web application for managing saved content, searching, and configuration.
4.2.2 Functional Requirements
ID
Requirement
Priority
WEB-001
Dashboard displays all saved content
P0
WEB-002
Sidebar navigation: All, Browser, X, Categories, Folders
P0
WEB-003
Full-text search across all content
P0
WEB-004
Filter by source (Browser/X Likes/X Bookmarks)
P1
WEB-005
Grid and List view toggle
P1
WEB-006
Create, rename, delete folders
P1
WEB-007
Drag-and-drop items to folders
P1
WEB-008
Item detail view/modal
P1
WEB-009
Edit item category
P1
WEB-010
Delete items (move to Trash)
P0
WEB-011
Restore from Trash
P1
WEB-012
X OAuth connection flow
P0
WEB-013
X content display with author info
P0
WEB-014
X thread grouping
P1
WEB-015
"Deleted from X" indicator
P1
WEB-016
Account settings page
P0
WEB-017
Subscription management
P0
WEB-018
Export data (JSON)
P2

4.2.3 UI/UX Requirements
Responsive design: desktop (1024px+), tablet (768px+), mobile (320px+)
Page load: under 2 seconds
Search results: appear within 500ms
Infinite scroll for content lists (load 50 items, then paginate)
Skeleton loaders while content loads
Keyboard navigation support
Accessibility: WCAG 2.1 AA compliance

4.3 X Integration
4.3.1 Description
OAuth integration with X (Twitter) to import and sync user's likes and bookmarks.
4.3.2 Functional Requirements
ID
Requirement
Priority
X-001
OAuth 2.0 connection flow
P0
X-002
Read-only permissions (likes, bookmarks)
P0
X-003
Import all accessible likes
P0
X-004
Import all accessible bookmarks
P0
X-005
Store full tweet text
P0
X-006
Store author info (handle, name, avatar URL)
P0
X-007
Store media URLs (images)
P0
X-008
Detect and group threads
P1
X-009
Automatic sync (Free: daily, Plus: hourly)
P1
X-010
Manual sync trigger
P1
X-011
Detect deleted tweets, preserve content
P1
X-012
Disconnect X account
P0
X-013
Sync status display
P1
X-014
Import progress indicator
P0
X-015
Handle API rate limits gracefully
P0

4.3.3 Business Rules
API rate limits: Queue and retry with backoff
Maximum import: Based on X API limits (typically 800 items per request type)
Free tier: 500 X items max
Plus tier: 5,000 X items max
Sync frequency: Free (daily/manual), Plus (hourly), Pro (real-time)
Store full media for images; thumbnail only for videos
Mark items "Deleted from X" if detected as unavailable

4.4 AI Categorization
4.4.1 Description
Automatic categorization and tagging of saved content using AI/ML.
4.4.2 Functional Requirements
ID
Requirement
Priority
AI-001
Categorize new saves automatically
P1
AI-002
Assign one category per item
P1
AI-003
Generate 0-5 tags per item
P2
AI-004
Process async (not blocking save)
P0
AI-005
Display category on item cards
P1
AI-006
Allow user to change category
P1
AI-007
Learn from user corrections
P2
AI-008
Batch processing for imports
P1

4.4.3 Categories Taxonomy
Category
Description
Technology
Software, programming, tech news
Business
Startups, entrepreneurship, management
Marketing
Advertising, content, growth
Design
UI/UX, graphics, product design
Finance
Investing, personal finance, markets
Health
Fitness, nutrition, wellness
Productivity
Tools, workflows, efficiency
Learning
Education, tutorials, how-tos
Entertainment
Media, games, pop culture
News
Current events, journalism
Personal
Individual/misc content
Other
Uncategorized


5. Technical Requirements
5.1 Platform Requirements
Component
Technology
Notes
Chrome Extension
Manifest V3, JavaScript/TypeScript
Chrome only for MVP
Web Application
React, TypeScript, Vite
SPA architecture
Backend API
Node.js/Express or Python/FastAPI
TBD based on team
Database
PostgreSQL
Primary data store
Search
PostgreSQL full-text or Typesense
Semantic search may use vector DB
Authentication
OAuth 2.0 (Google, X), JWT
Magic link optional
File Storage
S3/Cloudflare R2
Media caching
Hosting
Vercel (frontend), Railway/Fly.io (backend)
Or equivalent

5.2 Performance Requirements
Metric
Target
Extension popup load
< 200ms
Tab save completion
< 2 seconds
Web app initial load
< 2 seconds
Search results display
< 500ms
X import (1000 items)
< 60 seconds
API response time (p95)
< 200ms

5.3 Security Requirements
Requirement
Implementation
Data encryption at rest
AES-256
Data encryption in transit
TLS 1.3
OAuth token storage
Encrypted, not exposed to client
Password hashing
bcrypt with appropriate rounds
Session management
JWT with refresh tokens
Rate limiting
Per-user and per-IP
CORS
Restricted to Synk domains

5.4 Scalability Requirements (MVP)
Support 10,000 users
Support 5,000,000 saved items total
Handle 100 concurrent active users
99.5% uptime target

6. Dependencies
Dependency
Type
Owner
Risk
X API access
External
X/Twitter
Medium - API changes/restrictions
Google OAuth
External
Google
Low
OpenAI/Claude API
External
AI provider
Medium - costs, availability
Stripe
External
Stripe
Low
Chrome Web Store
External
Google
Low - approval process
PostgreSQL hosting
Infrastructure
DevOps
Low


7. Assumptions & Risks
7.1 Assumptions
Users have Chrome browser installed
Users have or will create an X account for that feature
Users are willing to grant OAuth permissions
X API will remain accessible for read operations
AI categorization quality is sufficient for user value
Free tier limits (500 items) will drive upgrade consideration
Users prefer automatic organization over manual
7.2 Risks
Risk
Likelihood
Impact
Mitigation
X API restrictions
Medium
High
Design for graceful degradation; browser-only value
Chrome extension rejection
Low
Critical
Strict policy compliance; pre-review checklist
AI costs exceed budget
Medium
Medium
Usage limits; batch processing; prompt optimization
Poor search quality
Medium
High
Extensive testing; fallback to basic search
Low activation rate
Medium
High
Onboarding optimization; user research
Data breach
Low
Critical
Security audit; encryption; access controls


8. Out of Scope (MVP)
Feature
Reason
Timeline
Mobile native apps
Complexity
v1.2+
Firefox/Safari extensions
Chrome-first validation
v1.1
Notion integration
Integration complexity
v1.1
Obsidian integration
Niche segment
v1.2
AI summarization
Costs, not core
v1.1+
AI Q&A
Complex, expensive
v1.2+
Shareable collections
Social features premature
v1.1
Smart folders
Power feature
v1.1
Team/workspace features
B2C first
Year 2
Zapier/Make integration
Complexity
v1.2
Multiple X accounts
Edge case
Pro tier, v1.1
Custom keyboard shortcuts
Nice-to-have
v1.1


9. Open Questions
Question
Owner
Due Date
Status
What is exact X API rate limit handling strategy?
Backend Lead
Week 2
Open
Should we support image extraction from pages?
Product
Week 1
Open
What LLM to use for categorization (GPT-4o, Claude, other)?
Tech Lead
Week 2
Open
Do we need a waitlist before public beta?
Growth
Week 3
Open
What analytics platform to use?
Product
Week 1
Open
What is our GDPR compliance strategy?
Legal/Product
Week 4
Open
Should onboarding require first save or allow skip entirely?
Product
Week 2
Open


10. Approvals
Role
Name
Date
Signature
Head of Product






Tech Lead






Design Lead






Engineering Lead








Appendix A: User Story Summary
Epic
Story ID
Title
Priority
Points
Account
US-1.1
Account Creation
P0
5
Account
US-1.2
Login
P0
3
Account
US-1.3
Extension Authentication
P0
5
Tab Capture
US-2.1
Save All Tabs
P0
8
Tab Capture
US-2.2
Save Current Tab Only
P1
3
Tab Capture
US-2.3
Selective Tab Save
P1
5
Tab Capture
US-2.4
Undo Save
P1
5
Tab Capture
US-2.5
Extension Popup Quick View
P1
3
Tab Capture
US-2.6
Extension Search
P2
5
X Integration
US-3.1
Connect X Account
P0
8
X Integration
US-3.2
Import X Likes and Bookmarks
P0
13
X Integration
US-3.3
Ongoing X Sync
P1
5
X Integration
US-3.4
View X Content
P0
5
X Integration
US-3.5
Permanent Archive
P1
5
Organization
US-4.1
AI Categorization
P1
8
Organization
US-4.2
Manual Folders
P1
5
Organization
US-4.3
Bulk Actions
P2
5
Search
US-5.1
Full-Text Search
P0
8
Search
US-5.2
Source Filtering
P1
3
Search
US-5.3
Search Results Display
P0
5
Search
US-5.4
Semantic Search (Basic)
P2
13
Dashboard
US-6.1
Dashboard Home
P0
5
Dashboard
US-6.2
Content Grid/List View
P1
3
Dashboard
US-6.3
Item Detail View
P1
5
Settings
US-7.1
Extension Settings
P1
3
Settings
US-7.2
X Sync Settings
P1
3
Settings
US-7.3
Subscription Management
P0
5
Onboarding
US-8.1
First-Time User Onboarding
P0
5

Total Story Points: ~155 points
Estimated MVP Duration: 10-12 weeks (assuming 15-20 points/week velocity)

Document Version: 1.0 | January 2026 | The Product Hangar

