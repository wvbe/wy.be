import type { Metadata } from 'next';
import './layout.css';
import styles from './layout.module.css';
import Link from 'next/link';

export const metadata: Metadata = {
	title: 'https://wy.be',
	description: 'My personal website, v2024',
	creator: 'Wybe',
	robots: 'index, follow',
};

const menuLinks = ['/', '/privacy-policy'];

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body>
				<div className={styles.wrapper}>
					<nav className={styles.nav}>
						{menuLinks.sort().map((link) => (
							<Link key={link} href={link}>
								{link}
							</Link>
						))}
					</nav>

					{children}
					<aside className={styles.copyright}>
						whatever I said, if it was smart it copyrighted
					</aside>
				</div>
			</body>
		</html>
	);
}
