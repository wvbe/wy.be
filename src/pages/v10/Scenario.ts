import gsap from 'gsap';
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
	parent: Node | null;
	rotation: { x: number; y: number; z: number };
	distance: number;
	group: THREE.Group;
};

const C3PR = 300;

export class Scenario extends Controller {
	private defaultCameraDistance = 3;
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
		const rootNode = (function createRandomizedNodeGraph(
			node: NodeConfiguration,
			parent: Node | null = null,
		): Node {
			let depth = 0,
				p = parent;
			while (p) {
				depth++;
				p = p.parent;
			}
			const nnode: Node = {
				...node,
				rotation: {
					x: 2 * Math.PI * Math.random(),
					y: (depth <= 1 ? 2 : 0.8) * Math.PI * Math.random(),
					z: (depth <= 1 ? 2 : 0.2) * Math.PI * Math.random(),
				},
				distance: depth <= 1 ? 3 : 2,
				parent,
				children: [],
				group: new THREE.Group(),
			};
			nnode.children.push(...node.children.map((c) => createRandomizedNodeGraph(c, nnode)));
			return nnode;
		})(graph, null);

		const initialCamera = this.getCameraSettingsForNode(rootNode);
		this.setCameraPosition(initialCamera.position.multiplyScalar(2));
		this.setCameraFocusOnVector3(initialCamera.target);
		this.camera.up = initialCamera.up;

		this.scene.add(new THREE.AmbientLight(0xffffff, 0.3));

		const directional1 = new THREE.DirectionalLight(0xffffff, 1.8);
		directional1.position.set(1 * C3PR, 1 * C3PR, 1 * C3PR).normalize();
		this.scene.add(directional1);

		const directional2 = new THREE.DirectionalLight(0xffffff, 2.7);
		directional2.position.set(-1 * C3PR, 1 * C3PR, -1 * C3PR).normalize();
		this.scene.add(directional2);

		this.scene.add(this.createNodeMesh(rootNode));

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
				// this.switchNodeWindow(null);
			}
			for (let i = 0; i < intersections.length; i++) {
				const onClick = (intersections[i].object as any)?.userData?.onClick;
				if (typeof onClick === 'function') {
					onClick();
					break;
				}
			}
		});
		this.switchNodeWindow(rootNode);
		this.animateCameraFocusOnNode(rootNode);
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
		group.rotateY(-0.5 * Math.PI);
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
		el.style.userSelect = 'none';
		el.style.backgroundColor = 'red';
		el.style.border = '1px solid red';
		el.style.width = `${C3PR * 1.6}px`;
		el.style.height = `${C3PR * 1}px`;

		return el;
	}

	/**
	 * Create the box and lines making up one node in the total graph. Set click handlers etc.
	 */
	private createNodeMesh(node: Node, parent?: Node) {
		const group = new THREE.Group();
		const geometry = new THREE.IcosahedronGeometry(0.02 * C3PR, 1);
		// const geometry = new THREE.BoxGeometry(0.1 * C3PR, 0.1 * C3PR, 0.1 * C3PR);
		const material = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: false });
		const mesh = new THREE.Mesh(geometry, material);
		const innergroup = node.group;

		mesh.userData.onClick = () => {
			this.switchNodeWindow(node);
			this.animateCameraFocusOnNode(node);
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

	private animateGsap<Thing extends {}>(
		from: Thing,
		to: Thing,
		duration: number,
		ease = 'expo.inOut',
	): Promise<void> {
		const promise = new Promise<void>((resolve) =>
			gsap.to(from, {
				...to,
				ease,
				duration,
				onUpdate: () => {
					this.controls.update();
				},
				onComplete: () => {
					resolve();
				},
			}),
		);
		return promise;
	}

	private getCameraSettingsForNode(node: Node) {
		const target = node.group.getWorldPosition(new THREE.Vector3());

		const deltaBetweenNodeAndParentVector = node.parent
			? node.parent.group.getWorldPosition(new THREE.Vector3()).sub(target).normalize()
			: new THREE.Vector3(1, 0, 0);
		const position = target
			.clone()
			.sub(deltaBetweenNodeAndParentVector.multiplyScalar(this.defaultCameraDistance * C3PR));

		const up = new THREE.Vector3(0, 1, 0).applyQuaternion(
			node.group.getWorldQuaternion(new THREE.Quaternion()),
		);

		return {
			target,
			position,
			up,
		};
	}
	/**
	 * Animates the camera to 1) move in front of the node that is being looked at, 2) point at the node
	 * and 3) adjust its own rotation to that of the node.
	 */
	private async animateCameraFocusOnNode(node: Node) {
		const animations: Promise<void>[] = [];

		this.controls.enabled = false;
		const { target, position, up } = this.getCameraSettingsForNode(node);

		// Change what the camera is pointing at
		animations.push(this.animateGsap(this.controls.target, target, 1, 'expo.out'));

		// Change where the camera is positioned
		const positionJiggle = new THREE.Vector3(
			0.7 + Math.random() * 0.6,
			0.7 + Math.random() * 0.6,
			0.7 + Math.random() * 0.6,
		);
		animations.push(this.animateGsap(this.camera.position, position.multiply(positionJiggle), 1.5));

		// Change the "Up" direction of the camera to rotate it. This works better than changing the camera .rotation, because
		// of some normalisation thing in OrbitControls;
		// const upJiggle = new THREE.Vector3(Math.random() * -5, 1, -0.25 + Math.random() * 0.5);
		animations.push(this.animateGsap(this.camera.up, up, 1.5));

		await Promise.all(animations);
		this.controls.enabled = true;
	}
}
