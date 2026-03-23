# 🎨 Pinterest-Style Event Cards Documentation

## Overview
Created stunning, Pinterest-inspired event cards with interactive hover effects and functional action buttons. The cards showcase events in a beautiful masonry grid layout with smooth animations.

## Features

### 🎯 Visual Design
- **Full-width cover images** with elegant gradient overlays
- **Smooth zoom effect** on hover (image scales up)
- **Blur backdrop** overlay appears on hover
- **Rounded corners** (16px) with shadow effects
- **Responsive heights** (auto-rows-max for Pinterest layout)

### 🎮 Interactive Elements

#### Always Visible
- **Event Title** - Bold, clear heading
- **Date & Time** - Calendar icon with formatted date/time
- **Location** - Map pin icon with location
- **Attendee Count** - People icon showing "X joined"
- **Creator Name** - Small text showing who created the event
- **"Your Event" Badge** - Shows for events you own

#### Hover Action Buttons
When you hover over an event card, 4 functional buttons appear:

1. **Join Event** / **Going** Button
   - Primary button (blue by default)
   - Shows "Join Event" with person+plus icon initially
   - Changes to green "✓ Going" when joined
   - Loading spinner during action
   - Sends notification to event creator
   - RSVP count updates in real-time

2. **Share** Button
   - Outline style (white/transparent)
   - Uses native Web Share API when available
   - Falls back to clipboard copy
   - Toast notification on success

3. **Report** Button
   - Red-tinted, only shows if not your event
   - Reports inappropriate events
   - Creates notification in system
   - Includes loading states

4. **View Details** Button
   - Links to full event detail page
   - Opens event details view

### 📱 Responsive Layout

```
Mobile (1 column):
[Event Card]
[Event Card]
[Event Card]

Tablet (2 columns):
[Event Card] [Event Card]
[Event Card] [Event Card]

Desktop (3 columns):
[Event Card] [Event Card] [Event Card]
[Event Card] [Event Card] [Event Card]
```

### 🎬 Animations

- **Card appears**: Staggered fade-in with y-translate (50ms delay per card)
- **Hover overlay**: Smooth fade-in (0.2s duration)
- **Button interactions**: 
  - Scale up on hover (1.05x)
  - Scale down on click (0.95x)
- **Image zoom**: Smooth transform on hover
- **Spinner**: Rotating animation during loading

## Component Structure

### EventCard Component
**Location**: `src/components/EventCard.tsx`

**Props**:
```typescript
interface EventCardProps {
  event: any;                    // Event data object
  isOwner: boolean;              // Is current user the event owner
  isJoined: boolean;             // Has current user joined
  attendeeCount: number;         // Total attendees
  creatorName: string;           // Name of event creator
  onEdit: (event: any) => void;  // Edit callback
  onDelete: (id: string) => void; // Delete callback
  index?: number;                // For stagger animation
}
```

**Key Features**:
- All data mutations (RSVP, Share, Report) are self-contained
- Handles loading states independently
- Updates parent queries via QueryClient
- Fully responsive with Tailwind breakpoints

## Database Interactions

### Queries Used
- `event_rsvps` - Check user RSVP status
- `notifications` - Send RSVP notifications
- Existing queries from parent (EventsPage)

### Mutations Performed
1. **RSVP Toggle**: Insert/delete from `event_rsvps`
2. **Notification**: Insert into `notifications` when user joins
3. **Report**: Creates notification (admin would later review)

## Usage in EventsPage

```typescript
<EventCard
  event={event}
  isOwner={event.user_id === user!.id}
  isJoined={myRsvps.includes(event.id)}
  attendeeCount={rsvpCounts[event.id] ?? 0}
  creatorName={eventCreators[event.user_id] || "Artist"}
  onEdit={openEdit}
  onDelete={(id) => deleteEvent.mutate(id)}
  index={idx}
/>
```

## Styling Details

### Color Scheme
- **Primary Button**: Blue (join action)
- **Success State**: Green (when already joined)
- **Report Button**: Red/scarlet tint
- **Overlay**: Black with 60% opacity + backdrop blur

### Typography
- **Title**: `font-display` bold, lg/xl size
- **Meta**: Small text with icons
- **Creator**: Extra small, muted foreground

### Effects
- **Shadow**: `shadow-lg` default, `shadow-2xl` on hover
- **Border Radius**: Rounded-2xl for cards
- **Transitions**: 300ms for smooth effects

## Technical Implementation

### State Management
- Uses React hooks for local UI state
- React Query for data synchronization
- Framer Motion for animations

### Error Handling
- Try-catch blocks for async operations
- Silent failures for non-critical notifications
- Toast messages for user feedback

### Performance
- Lazy rendering with stagger animation
- Auto-rows-max for Pinterest masonry
- Efficient query invalidation

## Future Enhancements

- [ ] Add event filters (category, date range)
- [ ] Implement proper reports table in DB
- [ ] Add admin dashboard for reported events
- [ ] Event search functionality
- [ ] Save/bookmark events feature
- [ ] Comments/reviews on events

## Browser Compatibility

- **Web Share API**: Available on most modern browsers
  - Fallback: Clipboard copy for unsupported browsers
- **CSS**: Tailwind + modern CSS Grid/Flexbox
- **Animations**: Framer Motion compatible with all modern browsers

## Testing Checklist

- [x] Join/RSVP button functionality
- [x] Share button (native + fallback)
- [x] Report functionality
- [x] Edit/Delete for event owners
- [x] Hover animations smooth
- [x] Loading states visible
- [x] Toast notifications appear
- [x] Responsive on mobile/tablet/desktop
- [x] Past events display separately

