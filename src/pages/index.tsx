import { FC, useCallback, useEffect, useRef } from 'react';
import styles from './index/index.module.css';
import './index/index.css';

import { Scenario } from '@/pages/index/Scenario';

const Derp: FC = () => {
	const scenario = useRef<Scenario | null>(null);
	const startThreeScenario = useCallback((element: HTMLDivElement | null) => {
		if (!element) {
			return;
		}
		scenario.current = new Scenario(element, {
			enableAutoRotate: false,
			enablePan: false,
			enableZoom: true,
			fieldOfView: 45,
			pixelRatio: window.devicePixelRatio || 1,
			restrictCameraAngle: false,
		});

		scenario.current.start();
	}, []);

	const flipDarkMode = useCallback(() => {
		if (!scenario.current) {
			return;
		}
		scenario.current.setLightMode(!scenario.current.darkMode);
	}, []);

	return (
		<div>
			<div className={styles.three} ref={startThreeScenario}></div>

			<p className={styles.text}>
				wybe minnebo
				<br />
				built in 1988
				<br />
				webdevelopment since 2001
			</p>

			<a className={`${styles.nightlight} ${styles.button}`} onClick={flipDarkMode}>
				Day turns night
			</a>

			<div className={styles.ui}>
				<p>
					<a
						href="https://github.com/wvbe?tab=repositories"
						className={styles.button}
						title="GitHub is where I keep my public code, click here to visit."
					>
						code
					</a>{' '}
					<a
						href="https://www.instagram.com/wvvbe/"
						className={styles.button}
						title="Instagram is where I upload some of my prettier photos, click here to visit."
					>
						photo
					</a>{' '}
					<a
						href="https://www.linkedin.com/in/wybe/"
						className={styles.button}
						title="LinkedIn is where you can find my professional life, click here to visit."
					>
						werk
					</a>
				</p>
			</div>
		</div>
	);
};

export default Derp;
