import { DateTime } from "luxon";
import { v1, v3, v4, v5 } from "uuid";

export enum AutoGenerateStrategy {
	ISOTIME = "ISOTIME",
	ISODATE = "ISODATE",
	ISODATETIME = "ISODATETIME",
	UUIDV1 = "UUIDV1",
	// UUIDV2 = "UUIDV2",
	// UUIDV3 = "UUIDV3",
	UUIDV4 = "UUIDV4",
	// UUIDV5 = "UUIDV5",
}

interface AutoGenerateProps {
	strategy: AutoGenerateStrategy;
}

export function AutoGenerate(props?: AutoGenerateProps) {
	const { strategy = AutoGenerateStrategy.UUIDV4 } = props ?? {};
	return function (target: any, name: string) {
		let value: string;

		const getter = function () {
			if (value == undefined) {
				switch (strategy) {
					case AutoGenerateStrategy.ISOTIME: {
						value = DateTime.utc().toISOTime();
						break;
					}
					case AutoGenerateStrategy.ISODATE: {
						value = DateTime.utc().toISODate();
						break;
					}
					case AutoGenerateStrategy.ISODATETIME: {
						value = DateTime.utc().toISO();
						break;
					}
					case AutoGenerateStrategy.UUIDV1: {
						value = v1();
						break;
					}
					// case AutoGenerateStrategy.UUIDV2: {
					// 	value = v2();
					// 	break;
					// }
					// case AutoGenerateStrategy.UUIDV3: {
					// 	value = v3();
					// 	break;
					// }
					case AutoGenerateStrategy.UUIDV4: {
						value = v4();
						break;
					}
					// case AutoGenerateStrategy.UUIDV5: {
					// 	value = v5();
					// 	break;
					// }
				}
			}
			return value;
		};
		const setter = function (newVal: string) {
			value = newVal;
		};
		Object.defineProperty(target, name, {
			get: getter,
			set: setter,
		});
	};
}
