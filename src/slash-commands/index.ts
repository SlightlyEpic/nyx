import type { SlashCommand } from '@/types/command';
import ping from './ping';
import verify from './verify';

export default [
    ping,
    verify,
] satisfies SlashCommand[];
