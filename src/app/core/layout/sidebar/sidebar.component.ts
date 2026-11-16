import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideBarChart3 as BarChart3,
  LucideBell as Bell,
  LucideCalendarDays as CalendarDays,
  LucideChevronLeft as ChevronLeft,
  LucideCircleDollarSign as CircleDollarSign,
  LucideFileText as FileText,
  LucideHeartPulse as HeartPulse,
  LucideLayoutDashboard as LayoutDashboard,
  LucidePackage as Package,
  LucideSettings as Settings,
  LucideSmile as Smile,
  LucideStethoscope as Stethoscope,
  LucideUserCog as UserCog,
  LucideUsers as Users,
  LucideWallet as Wallet,
  type LucideIcon,
} from '@lucide/angular';
import { LucideIconComponent } from '../../../shared/components/lucide-icon/lucide-icon.component';

interface NavItem { label: string; icon: LucideIcon; route: string; badge?: string; }
interface NavGroup { label: string; items: NavItem[]; }

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LucideIconComponent],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent {
  @Input() collapsed = false;
  @Output() toggle = new EventEmitter<void>();

  readonly icons = {
    Smile, LayoutDashboard, Users, CalendarDays, Stethoscope, FileText,
    Wallet, Package, CircleDollarSign, UserCog, BarChart3, Bell,
    Settings, ChevronLeft, HeartPulse,
  };

  readonly groups: NavGroup[] = [
    {
      label: 'Espace clinique',
      items: [
        { label: 'Tableau de bord', icon: LayoutDashboard, route: '/dashboard' },
        { label: 'Patients', icon: Users, route: '/patients' },
        { label: 'Rendez-vous', icon: CalendarDays, route: '/appointments', badge: '8' },
        { label: 'Consultations', icon: Stethoscope, route: '/consultations' },
        { label: 'Odontogrammes', icon: Smile, route: '/odontograms' },
        { label: 'Actes & traitements', icon: HeartPulse, route: '/treatments' },
      ],
    },
    {
      label: 'Gestion',
      items: [
        { label: 'Facturation', icon: FileText, route: '/billing' },
        { label: 'Paiements & caisse', icon: Wallet, route: '/payments' },
        { label: 'Stocks', icon: Package, route: '/inventory' },
        { label: 'Finances', icon: CircleDollarSign, route: '/finance' },
      ],
    },
    {
      label: 'Administration',
      items: [
        { label: 'Personnel', icon: UserCog, route: '/staff' },
        { label: 'Rapports', icon: BarChart3, route: '/reports' },
        { label: 'Notifications', icon: Bell, route: '/notifications' },
        { label: 'Paramètres', icon: Settings, route: '/settings' },
      ],
    },
  ];
}