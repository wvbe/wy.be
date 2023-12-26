import * as THREE from 'three';
import { Controller } from '../../mess/three/Controller';
import { Event } from '../../mess/three/Event';
const PREFER_DARK_MODE = false;

export class Scenario extends Controller {
	start() {
		console.group('Setup scenario');
		this.setCameraPosition(new THREE.Vector3(0, 0, -6));
		this.setCameraFocusOnVector3(new THREE.Vector3(0, 0, 0));
		this.setLightMode(this.darkMode);
		this.setStageProps();
		this.startAnimationLoop();
		console.groupEnd();
	}

	public darkMode = PREFER_DARK_MODE;

	$light = new Event();

	setLightMode(nightlight: boolean) {
		this.darkMode = nightlight;
		globalThis.document.body.setAttribute('class', this.darkMode ? 'nightlight' : 'daylight');
		this.$light.emit();
	}

	toggleLightMode() {
		this.setLightMode(!this.darkMode);
	}

	async setStageProps() {
		this.scene.add(new THREE.AmbientLight(0xffffff, 0.3));

		const directional1 = new THREE.DirectionalLight(0xffffff, 1.8);
		directional1.position.set(1, 1, 1).normalize();
		this.scene.add(directional1);

		const directional2 = new THREE.DirectionalLight(0xffffff, 2.7);
		directional2.position.set(-1, 1, -1).normalize();
		this.scene.add(directional2);

		const gltf = await this.addGltf('gltf/pizza-low-res.gltf');

		const applyMaterialToMesh = () => {
			const material = new THREE.MeshPhongMaterial({
				color: this.darkMode ? 0xcccccc : 0x333333,
				wireframe: false,
				shininess: 100,
			});
			gltf.scene.traverse((o: THREE.Object3D) => {
				if (o instanceof THREE.Mesh) {
					o.material = material;
				}
			});
		};

		applyMaterialToMesh();

		this.$detach.on(this.$light.on(applyMaterialToMesh));
	}
}
