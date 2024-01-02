import * as THREE from 'three';
import { CSS3DObject } from 'three/examples/jsm/Addons.js';

import { Controller } from '../../mess/three/Controller';

type NodeConfiguration = {
	label: string;
	children: NodeConfiguration[];
};

type Node = {
	label: string;
	children: Node[];
	rotation: { x: number; y: number; z: number };
	distance: number;
	group: THREE.Group;
};

const C3PR = 100;

export class Scenario extends Controller {
	public constructor(element: HTMLElement, graph: NodeConfiguration) {
		super(element, {
			enableAutoRotate: false,
			enablePan: false,
			enableZoom: true,
			fieldOfView: 45,
			pixelRatio: window.devicePixelRatio || 1,
			restrictCameraAngle: false,
			renderCss3D: true,
			renderWebGL: true,
		});
		this.setCameraPosition(new THREE.Vector3(6 * C3PR, 0, 0));
		this.setCameraFocusOnVector3(new THREE.Vector3(0, 0, 0));

		this.scene.add(new THREE.AmbientLight(0xffffff, 0.3));

		const directional1 = new THREE.DirectionalLight(0xffffff, 1.8);
		directional1.position.set(1 * C3PR, 1 * C3PR, 1 * C3PR).normalize();
		this.scene.add(directional1);

		const directional2 = new THREE.DirectionalLight(0xffffff, 2.7);
		directional2.position.set(-1 * C3PR, 1 * C3PR, -1 * C3PR).normalize();
		this.scene.add(directional2);

		this.scene.add(
			this.createNodeMesh(
				(function createRandomizedNodeGraph(node: NodeConfiguration, depth = 0): Node {
					return {
						...node,
						rotation: {
							x: 2 * Math.PI * Math.random(),
							y: (depth <= 1 ? 2 : 0.8) * Math.PI * Math.random(),
							z: (depth <= 1 ? 2 : 0.2) * Math.PI * Math.random(),
						},
						distance: depth <= 1 ? 3 : 2,
						children: node.children.map((c) => createRandomizedNodeGraph(c, depth + 1)),
						group: new THREE.Group(),
					};
				})(graph),
			),
		);

		this.addAxisHelper();

		// Handle clicks, execute the onClick userData of whatever mesh intersects with the raycaster first.
		// Set as `mesh.userData.onClick = () => {…}`
		this.$click.on((event: MouseEvent) => {
			this.raycaster.setFromCamera(
				new THREE.Vector2(
					(event.offsetX / this.root.clientWidth) * 2 - 1,
					-(event.offsetY / this.root.clientHeight) * 2 + 1,
				),
				this.camera,
			);
			const intersections = this.raycaster.intersectObjects(this.scene.children, true);
			if (!intersections.length && this.activeNodeWindow) {
				this.switchNodeWindow(null);
			}
			for (let i = 0; i < intersections.length; i++) {
				const onClick = (intersections[i].object as any)?.userData?.onClick;
				if (typeof onClick === 'function') {
					onClick();
					break;
				}
			}
		});
	}

	/**
	 * The node for which a window is currently shown, can only be 0..1 at any time
	 */
	activeNodeWindow: null | {
		node: Node;
		destroy(): void;
	} = null;

	private switchNodeWindow(node: Node | null) {
		if (node === this.activeNodeWindow?.node) {
			return;
		}

		this.activeNodeWindow?.destroy();

		if (!node) {
			this.activeNodeWindow = null;
			return;
		}

		const group = this.createNodeWindow(node);
		node.group.add(group);

		this.activeNodeWindow = {
			node,
			destroy: () => {
				// Explicitly remove all children so that CSS3DObject is removed as well;
				group.children.forEach((c) => c.removeFromParent());
				group.removeFromParent();
			},
		};
	}

	/**
	 * Creates a 3D window floating over a node, representing the human-readable contents of that node.
	 */
	private createNodeWindow(node: Node): THREE.Group {
		const windowHeight = 1 * C3PR;
		const windowWidth = 1.6 * C3PR;
		const padding = 0.02 * C3PR;

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

		const contents = this.createNodeWindowHtml(node);
		const objectCSS = new CSS3DObject(contents);
		group.add(objectCSS);
		return group;
	}

	/**
	 * Create the HTML contents floating inside a node window.
	 */
	private createNodeWindowHtml(node: Node) {
		const el = window.document.createElement('div');
		el.appendChild(window.document.createTextNode(node.label));
		// el.style.backgroundColor = 'rgba(255,0,0,1)';
		el.style.userSelect = 'none';
		el.style.backgroundColor = 'red';
		el.style.border = '1px solid red';
		const size = C3PR;
		el.style.width = `${size * 1.6}px`;
		el.style.height = `${size * 1}px`;

		return el;
	}

	/**
	 * Create the box and lines making up one node in the total graph. Set click handlers etc.
	 */
	private createNodeMesh(node: Node, parent?: Node) {
		const group = new THREE.Group();
		// const geometry = new THREE.IcosahedronGeometry(0.15, 1);
		const geometry = new THREE.BoxGeometry(0.1 * C3PR, 0.1 * C3PR, 0.1 * C3PR);
		const material = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: false });
		const mesh = new THREE.Mesh(geometry, material);
		const innergroup = node.group;

		mesh.userData.onClick = () => {
			console.log('CLICKED A THING', node);
			this.switchNodeWindow(node);
			// innergroup.add(this.createNodeWindow(node));
		};

		innergroup.add(mesh);
		group.add(innergroup);

		if (parent) {
			const line = new THREE.Line(
				new THREE.BufferGeometry().setFromPoints([
					new THREE.Vector3(0, 0, 0),
					new THREE.Vector3(node.distance * C3PR, 0, 0),
				]),
				new THREE.LineBasicMaterial({
					color: 0x000000,
				}),
			);
			innergroup.add(line);

			group.rotateX(node.rotation.x);
			group.rotateY(node.rotation.y);
			group.rotateZ(node.rotation.z);
			innergroup.position.x = -node.distance * C3PR;
		}

		// const plane = createNodeWindow(node);
		// innergroup.add(plane);

		node.children.forEach((child) => {
			const gr = this.createNodeMesh(child, node);
			innergroup.add(gr);
		});

		return group;
	}
}
