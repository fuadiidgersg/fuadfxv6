import {
  LayoutDashboard,
  Settings,
  Palette,
  Bell,
  BarChart2,
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
  Briefcase,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'Trader',
    email: 'trader@journal.app',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'FUADFX',
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
          url: '/dashboard',
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
          title: 'Charts',
          url: '/charts',
          icon: BarChart2,
        },
        {
          title: 'Portfolio',
          url: '/portfolio',
          icon: Briefcase,
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
          title: 'Journal',
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
              title: 'Personalisation',
              url: '/settings/appearance',
              icon: Palette,
            },
            {
              title: 'Notifications',
              url: '/settings/notifications',
              icon: Bell,
            },
            {
              title: 'Trading',
              url: '/settings/trading',
              icon: BarChart2,
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
