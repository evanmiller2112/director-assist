import {
	User,
	Users,
	MapPin,
	Flag,
	Package,
	Swords,
	Calendar,
	Sun,
	Clock,
	BookOpen,
	UserCircle,
	Home,
	Heart,
	Star,
	Shield,
	Crown,
	Gem,
	Skull,
	Flame,
	Zap,
	Moon,
	Cloud,
	Mountain,
	TreeDeciduous,
	Building,
	Castle,
	Ship,
	Compass,
	Map,
	Scroll,
	Feather,
	Music,
	Drama,
	Eye,
	Key,
	Lock,
	Unlock,
	Target,
	Crosshair,
	Award,
	Trophy,
	Medal,
	Coins,
	Wallet,
	Briefcase,
	Hammer,
	Wrench,
	Pickaxe,
	Axe,
	Wand2,
	Sparkles,
	Ghost,
	Bug,
	Leaf,
	Flower,
	Apple,
	Wine,
	Utensils,
	Tent,
	Footprints,
	Dog,
	Bird,
	Fish
} from 'lucide-svelte';

// Type for Lucide icons
export type IconComponent = typeof User;

// All available icons for custom entity types
export const AVAILABLE_ICONS: Record<string, IconComponent> = {
	// People
	user: User,
	users: Users,
	'user-circle': UserCircle,

	// Locations
	'map-pin': MapPin,
	home: Home,
	building: Building,
	castle: Castle,
	mountain: Mountain,
	'tree-deciduous': TreeDeciduous,
	tent: Tent,

	// Objects
	package: Package,
	gem: Gem,
	key: Key,
	scroll: Scroll,
	coins: Coins,
	trophy: Trophy,
	medal: Medal,
	award: Award,

	// Organizations
	flag: Flag,
	shield: Shield,
	crown: Crown,

	// Combat/Action
	swords: Swords,
	target: Target,
	crosshair: Crosshair,

	// Magic/Fantasy
	wand2: Wand2,
	sparkles: Sparkles,
	flame: Flame,
	zap: Zap,
	ghost: Ghost,
	skull: Skull,

	// Nature
	sun: Sun,
	moon: Moon,
	cloud: Cloud,
	leaf: Leaf,
	flower: Flower,
	bird: Bird,
	fish: Fish,
	dog: Dog,
	bug: Bug,

	// Time/Events
	calendar: Calendar,
	clock: Clock,

	// Knowledge
	book: BookOpen,
	feather: Feather,

	// Travel
	ship: Ship,
	compass: Compass,
	map: Map,
	footprints: Footprints,

	// Tools
	hammer: Hammer,
	wrench: Wrench,
	pickaxe: Pickaxe,
	axe: Axe,

	// Social
	heart: Heart,
	star: Star,
	music: Music,
	drama: Drama,
	eye: Eye,

	// Security
	lock: Lock,
	unlock: Unlock,

	// Commerce
	wallet: Wallet,
	briefcase: Briefcase,

	// Food
	apple: Apple,
	wine: Wine,
	utensils: Utensils
};

// Get icon component by name
export function getIconComponent(iconName: string): IconComponent {
	return AVAILABLE_ICONS[iconName] ?? User;
}

// Get list of all icon names (for icon picker)
export function getAvailableIconNames(): string[] {
	return Object.keys(AVAILABLE_ICONS);
}

// Icon categories for better organization in the picker
export const ICON_CATEGORIES: Record<string, string[]> = {
	People: ['user', 'users', 'user-circle'],
	Locations: ['map-pin', 'home', 'building', 'castle', 'mountain', 'tree-deciduous', 'tent'],
	Objects: ['package', 'gem', 'key', 'scroll', 'coins', 'trophy', 'medal', 'award'],
	Organizations: ['flag', 'shield', 'crown'],
	Combat: ['swords', 'target', 'crosshair'],
	Magic: ['wand2', 'sparkles', 'flame', 'zap', 'ghost', 'skull'],
	Nature: ['sun', 'moon', 'cloud', 'leaf', 'flower', 'bird', 'fish', 'dog', 'bug'],
	Time: ['calendar', 'clock'],
	Knowledge: ['book', 'feather'],
	Travel: ['ship', 'compass', 'map', 'footprints'],
	Tools: ['hammer', 'wrench', 'pickaxe', 'axe'],
	Social: ['heart', 'star', 'music', 'drama', 'eye'],
	Security: ['lock', 'unlock'],
	Commerce: ['wallet', 'briefcase'],
	Food: ['apple', 'wine', 'utensils']
};

// Friendly display names for icons
export const ICON_DISPLAY_NAMES: Record<string, string> = {
	user: 'Person',
	users: 'Group',
	'user-circle': 'Profile',
	'map-pin': 'Pin',
	home: 'Home',
	building: 'Building',
	castle: 'Castle',
	mountain: 'Mountain',
	'tree-deciduous': 'Tree',
	tent: 'Tent',
	package: 'Package',
	gem: 'Gem',
	key: 'Key',
	scroll: 'Scroll',
	coins: 'Coins',
	trophy: 'Trophy',
	medal: 'Medal',
	award: 'Award',
	flag: 'Flag',
	shield: 'Shield',
	crown: 'Crown',
	swords: 'Swords',
	target: 'Target',
	crosshair: 'Crosshair',
	wand2: 'Wand',
	sparkles: 'Sparkles',
	flame: 'Flame',
	zap: 'Lightning',
	ghost: 'Ghost',
	skull: 'Skull',
	sun: 'Sun',
	moon: 'Moon',
	cloud: 'Cloud',
	leaf: 'Leaf',
	flower: 'Flower',
	bird: 'Bird',
	fish: 'Fish',
	dog: 'Dog',
	bug: 'Bug',
	calendar: 'Calendar',
	clock: 'Clock',
	book: 'Book',
	feather: 'Feather',
	ship: 'Ship',
	compass: 'Compass',
	map: 'Map',
	footprints: 'Footprints',
	hammer: 'Hammer',
	wrench: 'Wrench',
	pickaxe: 'Pickaxe',
	axe: 'Axe',
	heart: 'Heart',
	star: 'Star',
	music: 'Music',
	drama: 'Drama',
	eye: 'Eye',
	lock: 'Lock',
	unlock: 'Unlock',
	wallet: 'Wallet',
	briefcase: 'Briefcase',
	apple: 'Apple',
	wine: 'Wine',
	utensils: 'Utensils'
};
