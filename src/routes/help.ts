import express, { Router } from 'express';

const router: Router = express.Router();

// Get help content
router.get('/', async (req, res) => {
  try {
    const helpSections = [
      {
        id: 'getting-started',
        title: 'Getting Started',
        description: 'Learn the basics of using the admin panel',
        icon: 'Book',
        color: 'bg-blue-500',
        items: [
          'How to navigate the admin panel',
          'Setting up your account',
          'Understanding the dashboard',
        ],
        content: {
          overview: 'Welcome to the SMH Holdings Admin Panel. This comprehensive guide will help you get started with managing your properties, bookings, and users.',
          sections: [
            {
              title: 'Navigation',
              content: 'The admin panel is organized into sections accessible through the sidebar menu. Each section provides tools for managing different aspects of your business.'
            },
            {
              title: 'Account Setup',
              content: 'Your account comes with predefined permissions. Contact your administrator if you need access to additional features.'
            },
            {
              title: 'Dashboard Overview',
              content: 'The dashboard provides a comprehensive view of your business metrics, including occupancy rates, revenue, and recent activities.'
            }
          ]
        }
      },
      {
        id: 'user-management',
        title: 'User Management',
        description: 'Manage users and their permissions',
        icon: 'HelpCircle',
        color: 'bg-green-500',
        items: [
          'Adding new users',
          'Managing user permissions',
          'User roles and access levels',
        ],
        content: {
          overview: 'User management allows you to control who has access to your admin panel and what they can do.',
          sections: [
            {
              title: 'Adding Users',
              content: 'Navigate to the Users section and click "Add User". Fill in the required information and assign appropriate roles.'
            },
            {
              title: 'Permissions',
              content: 'Different roles have different permissions. Administrators have full access, while other roles have limited access based on their needs.'
            }
          ]
        }
      },
      {
        id: 'property-management',
        title: 'Property Management',
        description: 'Manage your properties and listings',
        icon: 'FileText',
        color: 'bg-purple-500',
        items: [
          'Adding properties',
          'Editing property details',
          'Managing property listings',
        ],
        content: {
          overview: 'Property management is the core of your business. Here you can add, edit, and manage all your properties.',
          sections: [
            {
              title: 'Adding Properties',
              content: 'Go to Properties section and click "Add Property". Fill in all required details including location, pricing, and amenities.'
            },
            {
              title: 'Property Details',
              content: 'Each property has detailed information including photos, descriptions, pricing, and availability settings.'
            }
          ]
        }
      },
      {
        id: 'bookings',
        title: 'Bookings',
        description: 'Manage reservations and bookings',
        icon: 'MessageCircle',
        color: 'bg-orange-500',
        items: [
          'Creating bookings',
          'Managing reservations',
          'Booking status updates',
        ],
        content: {
          overview: 'Booking management helps you track all reservations and manage guest stays.',
          sections: [
            {
              title: 'Creating Bookings',
              content: 'Navigate to Bookings section and create new reservations manually or let guests book through your website.'
            },
            {
              title: 'Booking Status',
              content: 'Track booking status from confirmed to completed. Handle cancellations and modifications as needed.'
            }
          ]
        }
      }
    ];

    res.json({
      success: true,
      data: { helpSections }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch help content'
    });
  }
});

// Get specific help section
router.get('/:sectionId', async (req, res) => {
  try {
    const { sectionId } = req.params;
    
    // This would typically fetch from database
    // For now, return a placeholder
    res.json({
      success: true,
      data: {
        section: {
          id: sectionId,
          title: 'Help Section',
          content: 'Detailed help content for this section...'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch help section'
    });
  }
});

export default router;
