import { FC, useCallback } from 'react';
import './v10/v10.css';
import styles from './v10/v10.module.css';

import { Scenario } from './v10/Scenario';

const Page: FC = () => {
	const startThreeScenario = useCallback((element: HTMLDivElement | null) => {
		if (!element) {
			return;
		}
		const scenario = new Scenario(element, {
			label: 'Wybe',
			children: [
				{
					label: 'Work',
					children: [
						{ label: 'Developer', children: [] },
						{ label: 'UX designer', children: [] },
						{ label: 'Product owner', children: [] },
						{ label: 'Team lead', children: [] },
						{ label: 'Developer', children: [] },
					],
				},
				{
					label: 'Code',
					children: [
						{ label: 'docxml', children: [] },
						{ label: 'xquery-cli', children: [] },
						{ label: 'fark', children: [] },
						{ label: 'ask-nicely', children: [] },
						{ label: 'node-schematron', children: [] },
					],
				},
				{
					label: 'Personal',
					children: [],
				},
			],
		});
		scenario.startAnimationLoop();
	}, []);
	return <div className={styles.three} ref={startThreeScenario} />;
};

export default Page;
