import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './layout.css';
import styles from './layout.module.css';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
	title: 'https://wy.be',
	description: 'My personal website, v2024',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body className={inter.className}>
				<div className={styles.wrapper}>
					<nav>
						<Link href={'/'}>/</Link>
						<Link href={'/privacy-policy'}>/privacy-policy</Link>
					</nav>

					{children}
				</div>
			</body>
		</html>
	);
}
