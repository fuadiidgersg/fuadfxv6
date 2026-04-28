import {
  LayoutDashboard,
  Settings,
  Palette,
  Bell,
  Monitor,
  UserCog,
  Wrench,
  HelpCircle,
  CandlestickChart,
  LineChart,
  CalendarDays,
  BookOpen,
  Notebook,
  Newspaper,
  TrendingUp,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'trader',
    email: 'trader@journal.app',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Fuadfx',
      logo: TrendingUp,
      plan: 'Pro Trader',
    },
    {
      name: 'Live FTMO 100k',
      logo: CandlestickChart,
      plan: 'Funded Account',
    },
    {
      name: 'Demo OANDA',
      logo: LineChart,
      plan: 'Practice',
    },
  ],
  navGroups: [
    {
      title: 'Trading',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'Trades',
          url: '/tasks',
          icon: CandlestickChart,
        },
        {
          title: 'Analytics',
          url: '/analytics',
          icon: LineChart,
        },
        {
          title: 'Calendar',
          url: '/calendar',
          icon: CalendarDays,
        },
      ],
    },
    {
      title: 'Workspace',
      items: [
        {
          title: 'Strategies',
          url: '/apps',
          icon: BookOpen,
        },
        {
          title: 'Journal Notes',
          url: '/chats',
          icon: Notebook,
        },
        {
          title: 'Economic News',
          url: '/news',
          icon: Newspaper,
        },
      ],
    },
    {
      title: 'Other',
      items: [
        {
          title: 'Settings',
          icon: Settings,
          items: [
            {
              title: 'Profile',
              url: '/settings',
              icon: UserCog,
            },
            {
              title: 'Account',
              url: '/settings/account',
              icon: Wrench,
            },
            {
              title: 'Appearance',
              url: '/settings/appearance',
              icon: Palette,
            },
            {
              title: 'Notifications',
              url: '/settings/notifications',
              icon: Bell,
            },
            {
              title: 'Display',
              url: '/settings/display',
              icon: Monitor,
            },
          ],
        },
        {
          title: 'Help Center',
          url: '/help-center',
          icon: HelpCircle,
        },
      ],
    },
  ],
}
