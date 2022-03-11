// should make a global data object

interface GylfieResponseError {
	status: number;
	code: string;
	name: string;
	message: string;
	time: string;
}

export interface GylfieResponse {
	data?: any;
	error?: GylfieResponseError;
}
