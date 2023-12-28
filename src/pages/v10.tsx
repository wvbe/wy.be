import * as THREE from 'three';
import { FC, RefCallback, useCallback, useEffect, useRef } from 'react';
import styles from './v10/v10.module.css';
import './v10/v10.css';

import { Scenario } from '@/pages/index/Scenario';
import { Controller } from '@/mess/three/Controller';
import { title } from 'process';

type Node = {
	label: string;
	children: Node[];
};
type RichNode = {
	label: string;
	children: RichNode[];
	rotation: { x: number; y: number; z: number };
	distance: number;
};

const graph = (function createRandomizedNodeGraph(node: Node, depth = 0): RichNode {
	return {
		...node,
		rotation: {
			x: 2 * Math.PI * Math.random(),
			y: (depth <= 1 ? 2 : 0.8) * Math.PI * Math.random(),
			z: (depth <= 1 ? 2 : 0.2) * Math.PI * Math.random(),
		},
		distance: depth <= 1 ? 3 : 2,
		children: node.children.map((c) => createRandomizedNodeGraph(c, depth + 1)),
	};
})({
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
				{ label: 'UX designer', children: [] },
				{ label: 'Product owner', children: [] },
				{ label: 'Team lead', children: [] },
				{ label: 'Developer', children: [] },
				{ label: 'UX designer', children: [] },
				{ label: 'Product owner', children: [] },
				{ label: 'Team lead', children: [] },
				{ label: 'Developer', children: [] },
				{ label: 'UX designer', children: [] },
				{ label: 'Product owner', children: [] },
				{ label: 'Team lead', children: [] },
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
				{ label: 'docxml', children: [] },
				{ label: 'xquery-cli', children: [] },
				{ label: 'fark', children: [] },
				{ label: 'ask-nicely', children: [] },
				{ label: 'node-schematron', children: [] },
				{ label: 'docxml', children: [] },
				{ label: 'xquery-cli', children: [] },
				{ label: 'fark', children: [] },
				{ label: 'ask-nicely', children: [] },
				{ label: 'node-schematron', children: [] },
				{ label: 'docxml', children: [] },
				{ label: 'xquery-cli', children: [] },
				{ label: 'fark', children: [] },
				{ label: 'ask-nicely', children: [] },
				{ label: 'node-schematron', children: [] },
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

function createNodeWindow(): THREE.Group {
	const windowHeight = 1;
	const windowWidth = 1.6;
	const padding = 0.02;

	// Window outline
	const outline = new THREE.Mesh(
		new THREE.PlaneGeometry(windowWidth, windowHeight),
		new THREE.MeshBasicMaterial({
			color: 0,
			wireframe: true,
			side: THREE.DoubleSide,
		}),
	);

	// Window titlebar
	const titlebarHeight = padding * 3;
	const titlebarWidth = windowWidth - padding * 2;
	const titlebar = new THREE.Mesh(
		new THREE.PlaneGeometry(titlebarWidth, titlebarHeight),
		new THREE.MeshBasicMaterial({
			color: 0,
			wireframe: true,
			side: THREE.DoubleSide,
		}),
	);
	titlebar.position.y = windowHeight / 2 - titlebarHeight / 2 - padding;
	titlebar.position.z = padding;

	const group = new THREE.Group();
	group.rotateY(0.5 * Math.PI);
	group.add(outline);
	group.add(titlebar);

	return group;
}
function createNodeMesh(node: RichNode, parent?: RichNode) {
	const group = new THREE.Group();
	// const geometry = new THREE.IcosahedronGeometry(0.15, 1);
	const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
	const material = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: false });
	const mesh = new THREE.Mesh(geometry, material);
	const innergroup = new THREE.Group();
	innergroup.add(mesh);
	group.add(innergroup);

	if (parent) {
		const line = new THREE.Line(
			new THREE.BufferGeometry().setFromPoints([
				new THREE.Vector3(0, 0, 0),
				new THREE.Vector3(node.distance, 0, 0),
			]),
			new THREE.LineBasicMaterial({
				color: 0x000000,
			}),
		);
		innergroup.add(line);

		group.rotateX(node.rotation.x);
		group.rotateY(node.rotation.y);
		group.rotateZ(node.rotation.z);
		innergroup.position.x = -node.distance;
	}

	const plane = createNodeWindow();
	innergroup.add(plane);

	node.children.forEach((child) => {
		const gr = createNodeMesh(child, node);
		innergroup.add(gr);
	});

	return group;
}
function createScene(element: HTMLDivElement) {
	const controller = new Controller(element, {
		enableAutoRotate: false,
		enablePan: false,
		enableZoom: true,
		fieldOfView: 45,
		pixelRatio: window.devicePixelRatio || 1,
		restrictCameraAngle: false,
	});
	controller.setCameraPosition(new THREE.Vector3(6, 0, 0));
	controller.setCameraFocusOnVector3(new THREE.Vector3(0, 0, 0));

	controller.scene.add(new THREE.AmbientLight(0xffffff, 0.3));

	const directional1 = new THREE.DirectionalLight(0xffffff, 1.8);
	directional1.position.set(1, 1, 1).normalize();
	controller.scene.add(directional1);

	const directional2 = new THREE.DirectionalLight(0xffffff, 2.7);
	directional2.position.set(-1, 1, -1).normalize();
	controller.scene.add(directional2);

	// const geometry = new THREE.DodecahedronGeometry(0.2);
	// const geometry = new THREE.IcosahedronGeometry(0.15, 1);
	// const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
	// const material = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true });
	// const mesh = new THREE.Mesh(geometry, material);
	// controller.scene.add(mesh);

	controller.scene.add(createNodeMesh(graph));

	controller.addAxisHelper();

	return controller;
}
const Derp: FC = () => {
	const startThreeScenario = useCallback((element: HTMLDivElement | null) => {
		if (!element) {
			return;
		}
		const scene = createScene(element);
		scene.startAnimationLoop();
	}, []);
	return <div className={styles.three} ref={startThreeScenario} />;
};

export default Derp;
