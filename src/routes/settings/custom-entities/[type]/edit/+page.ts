import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	return {
		type: params.type
	};
};
