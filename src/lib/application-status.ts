import type { ApplicationStatus } from '$lib/server/db/schema';

export const applicationStatusLabels: Record<ApplicationStatus, string> = {
	draft: 'Entwurf',
	contacted: 'Kontaktiert',
	rejected: 'Absage',
	accepted: 'Zusage'
};

export const applicationStatusOrder: ApplicationStatus[] = [
	'draft',
	'contacted',
	'rejected',
	'accepted'
];

export const applicationStatusColorClass: Record<ApplicationStatus, string> = {
	draft: 'ws-status-draft',
	contacted: 'ws-status-contacted',
	rejected: 'ws-status-rejected',
	accepted: 'ws-status-accepted'
};
