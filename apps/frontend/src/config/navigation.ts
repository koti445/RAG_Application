import {
  BookOpen,
  Bot,
  FlaskConical,
  FolderKanban,
  GitBranch,
  Home,
  Layers,
  LayoutDashboard,
  MessageSquare,
  Network,
  Settings,
  Shield,
  Sparkles,
  TestTube2,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const primaryNavigation: NavSection[] = [
  {
    title: "Agent Studio",
    items: [
      { label: "Dashboard", href: "/home", icon: LayoutDashboard },
      { label: "Projects", href: "/projects", icon: FolderKanban },
    ],
  },
  {
    title: "Catalog",
    items: [
      { label: "Knowledge", href: "/knowledge", icon: BookOpen },
      { label: "Memory", href: "/memory", icon: Layers },
      { label: "Prompt Engineering", href: "/prompts", icon: Sparkles },
      { label: "RAG", href: "/rag", icon: Network },
      { label: "Agents", href: "/agents", icon: Bot },
    ],
  },
  {
    title: "Release Management",
    items: [
      { label: "Playground", href: "/playground", icon: MessageSquare },
      { label: "A/B Testing", href: "/ab-testing", icon: TestTube2 },
      { label: "Evaluation", href: "/evaluation", icon: FlaskConical },
    ],
  },
  {
    title: "Admin",
    items: [
      { label: "Settings", href: "/settings", icon: Settings },
      { label: "User Management", href: "/users", icon: Users },
      { label: "Audit Trail", href: "/audit", icon: Shield },
    ],
  },
];

export const knowledgeTabs = [
  { id: "knowledge-bases", label: "Knowledge Bases", href: "/knowledge", count: 0 },
  { id: "documents", label: "Documents", href: "/knowledge/documents", count: 0 },
  { id: "search-test", label: "Search & Test", href: "/knowledge/search" },
  { id: "rag-pipelines", label: "RAG Pipelines", href: "/knowledge/pipelines" },
  { id: "connectors", label: "Connectors", href: "/knowledge/connectors" },
];

export const categoryTree = [
  "All",
  "Product Engineering",
  "Finance",
  "Legal & Compliance",
  "Data Analytics",
  "Customer Support",
  "R & D / Innovation",
  "Human Resources",
  "Marketing",
  "Operations",
];
