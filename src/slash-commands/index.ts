import type { SlashCommand } from '@/types/command';
import ping from './ping';

export default [
    ping,
] satisfies SlashCommand[];
