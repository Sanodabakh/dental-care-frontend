import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideArrowRight,
  LucideBarChart3,
  LucideCalendarDays,
  LucideCheck,
  LucideChevronRight,
  LucideFileText,
  LucideMail,
  LucideMapPin,
  LucidePackage,
  LucidePhone,
  LucideShield,
  LucideSmile,
  LucideSparkles,
  LucideStar,
  LucideStethoscope,
  LucideUsers,
  LucideWallet,
  LucideZap,
  LucideMenu,
  LucideX,
} from '@lucide/angular';
import type { LucideIcon } from '@lucide/angular';
import { LucideIconComponent } from '../../shared/components/lucide-icon/lucide-icon.component';
import { AuthService } from '../../core/auth/auth.service';

interface LandingFeature {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface LandingModule {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
}

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  initials: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideIconComponent],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css'],
})
export class LandingComponent {
  private readonly auth = inject(AuthService);

  readonly icons = {
    Smile: LucideSmile,
    ArrowRight: LucideArrowRight,
    Check: LucideCheck,
    Users: LucideUsers,
    CalendarDays: LucideCalendarDays,
    Stethoscope: LucideStethoscope,
    FileText: LucideFileText,
    Package: LucidePackage,
    Wallet: LucideWallet,
    BarChart3: LucideBarChart3,
    Shield: LucideShield,
    Sparkles: LucideSparkles,
    Zap: LucideZap,
    Menu: LucideMenu,
    X: LucideX,
    Star: LucideStar,
    ChevronRight: LucideChevronRight,
    Mail: LucideMail,
    Phone: LucidePhone,
    MapPin: LucideMapPin,
  };

  readonly mobileMenuOpen = signal(false);
  readonly isAuthenticated = this.auth.isAuthenticated;

  readonly features: LandingFeature[] = [
    {
      icon: LucideUsers,
      title: 'Dossiers patients centralisés',
      description: 'Retrouvez les coordonnées, le suivi et les informations utiles de chaque patient dans un dossier unique.',
    },
    {
      icon: LucideCalendarDays,
      title: 'Agenda intelligent',
      description: 'Organisez les rendez-vous de l’équipe avec une vue claire du planning et des disponibilités.',
    },
    {
      icon: LucideStethoscope,
      title: 'Odontogramme interactif',
      description: 'Visualisez les soins dentaires grâce au schéma FDI et gardez une trace des observations.',
    },
    {
      icon: LucideFileText,
      title: 'Facturation simplifiée',
      description: 'Créez des factures détaillées et suivez leur état de règlement depuis le même espace.',
    },
    {
      icon: LucideWallet,
      title: 'Suivi des paiements',
      description: 'Enregistrez les règlements et consultez les soldes associés aux factures.',
    },
    {
      icon: LucidePackage,
      title: 'Gestion des stocks',
      description: 'Suivez les produits, les mouvements de stock et les seuils d’alerte.',
    },
    {
      icon: LucideBarChart3,
      title: 'Rapports d’activité',
      description: 'Consultez les indicateurs du cabinet et exportez les rapports de période.',
    },
    {
      icon: LucideShield,
      title: 'Accès protégé',
      description: 'Un espace de travail privé pour centraliser les opérations quotidiennes du cabinet.',
    },
  ];

  readonly modules: LandingModule[] = [
    { icon: LucideUsers, title: 'Patients', description: 'Dossiers et suivi patient', color: 'blue' },
    { icon: LucideCalendarDays, title: 'Rendez-vous', description: 'Agenda du cabinet', color: 'teal' },
    { icon: LucideStethoscope, title: 'Consultations', description: 'Parcours de soins', color: 'violet' },
    { icon: LucideSmile, title: 'Odontogramme', description: 'Schéma dentaire FDI', color: 'amber' },
    { icon: LucideFileText, title: 'Facturation', description: 'Factures et soldes', color: 'blue' },
    { icon: LucideWallet, title: 'Paiements', description: 'Suivi des règlements', color: 'green' },
    { icon: LucidePackage, title: 'Stocks', description: 'Produits et mouvements', color: 'red' },
    { icon: LucideBarChart3, title: 'Rapports', description: 'Indicateurs et exports', color: 'violet' },
  ];

  readonly testimonials: Testimonial[] = [
    {
      quote: 'Depuis que nous utilisons DentalCare, la gestion du cabinet est plus claire et le suivi des patients est centralisé.',
      name: 'Dr. Omar Fall',
      role: 'Chirurgien-dentiste · Cabinet Les Almadies',
      initials: 'OF',
    },
    {
      quote: 'L’odontogramme interactif permet de retrouver rapidement les observations et les soins associés à chaque dent.',
      name: 'Dr. Mamadou Diop',
      role: 'Orthodontiste · Cabinet Les Almadies',
      initials: 'MD',
    },
    {
      quote: 'Le planning partagé facilite l’organisation des rendez-vous au quotidien.',
      name: 'Fatou Sow',
      role: 'Secrétaire médicale',
      initials: 'FS',
    },
  ];

  readonly stats = [
    { value: '14', label: 'modules métier' },
    { value: 'FCFA', label: 'monnaie du cabinet' },
    { value: 'FDI', label: 'odontogramme dentaire' },
    { value: '1', label: 'espace de gestion' },
  ];

  readonly checkItems = [
    'Dossiers patients centralisés',
    'Agenda et rendez-vous',
    'Odontogramme interactif FDI',
    'Facturation et paiements',
  ];

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(isOpen => !isOpen);
  }

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    this.mobileMenuOpen.set(false);
  }
}
