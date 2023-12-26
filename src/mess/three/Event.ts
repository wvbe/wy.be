import { type CallbackFn, type DestroyerFn } from '../types.ts';

const MSG_MEMORY_LEAK = `You've called the destroyer of an event listener that was already destroyed, this may indicate a memory leak`;
/**
 * A Kreuz event emitter/listener. Always remember to unset your listeners at some point.
 */
export class Event<Args extends unknown[] = []> {
	#callbacks: CallbackFn<Args>[] = [];

	protected label: string;

	public constructor(label: string) {
		this.label = label;
	}

	/**
	 * @deprecated Here for test purposes only/
	 */
	get $$$listeners() {
		return this.#callbacks.length;
	}

	/**
	 * Wait for this event to trigger and run the callback every time it does.
	 *
	 * Returns a function with which the event listener is removed again.
	 */
	public on(callback: CallbackFn<Args>): DestroyerFn {
		if (typeof callback !== 'function') {
			// This error should be prevented by TypeScripts type checking. However, you might not
			// be using TS (or paying attention), and this bug will then not be discovered until the
			// event is actually triggered. It is therefore nicer to just check right away.
			throw new Error(
				`Expected callback of Event(${
					this.label ? `'${this.label}'` : ''
				})#on to be a function, received ${callback}`,
			);
		}
		const cancel = () => {
			const index = this.#callbacks.indexOf(callback);
			if (index === -1) {
				throw new Error(MSG_MEMORY_LEAK);
			}
			this.#callbacks.splice(index, 1);
		};
		this.#callbacks.push(callback);
		return cancel;
	}

	/**
	 * Wait for this event to trigger and run the callback only the first time it does.
	 *
	 * Returns a function with which the event listener is removed again.
	 */
	public once(callback: CallbackFn<Args>): DestroyerFn {
		if (typeof callback !== 'function') {
			// This error should be prevented by TypeScripts type checking. However, you might not
			// be using TS (or paying attention), and this bug will then not be discovered until the
			// event is actually triggered. It is therefore nicer to just check right away.
			throw new Error(
				`Expected callback of Event(${
					this.label ? `'${this.label}'` : ''
				})#once to be a function, received ${callback}`,
			);
		}
		const run = (...args: Args) => {
			callback(...args);
			cancel();
		};
		this.#callbacks.push(run);
		const cancel = () => {
			const index = this.#callbacks.indexOf(run);
			if (index === -1) {
				throw new Error(MSG_MEMORY_LEAK);
			}
			this.#callbacks.splice(index, 1);
		};
		return cancel;
	}

	/**
	 * Trigger all callbacks that were waiting for this event.
	 */
	public emit(...args: Args): void {
		// Create a new array from callbacks so that the loop is not affected
		// while once-ers change the true callbacks list by reference.
		//
		// Use a `for` loop to have one less useless line of stack tracing
		const callbacks = this.#callbacks.slice();
		for (let i = 0; i < callbacks.length; i++) {
			callbacks[i](...args);
		}
	}

	/**
	 * Set a callback for any time any of multiple events emit.
	 *
	 * @todo test
	 * @deprecated Untested
	 */
	public static onAny<Args extends unknown[] = []>(
		callback: CallbackFn<Args>,
		events: Event<Args>[],
	): DestroyerFn {
		const destroyers = events.map((event) => event.on(callback));
		return () => {
			for (let i = 0; i < destroyers.length; i++) {
				destroyers[i]();
			}
		};
	}

	/**
	 * Set a callback for only the first time any of the given events emit.
	 * @todo test
	 * @bug It seems like the destroyer of any event may be called twice
	 * @deprecated Not in use yet
	 */
	public static onceFirst(callback: CallbackFn, events: Event[]): DestroyerFn {
		const destroyers: DestroyerFn[] = [];
		let isAlreadyDestroyed = false;
		let triggerIndex: number;
		const destroy = () => {
			if (isAlreadyDestroyed) {
				throw new Error(MSG_MEMORY_LEAK);
			}
			for (let i = 0; i < destroyers.length; i++) {
				if (i !== triggerIndex) {
					destroyers[i]();
				} else {
					// The event that onced has already destroyed itself, no need to destroy it again
				}
			}
		};
		const cb = () => {
			callback();
			destroy();
			isAlreadyDestroyed = true;
		};
		events.forEach((event, index) => {
			destroyers.push(
				event.once(() => {
					triggerIndex = index;
					cb();
				}),
			);
		});
		return destroy;
	}

	/**
	 * Remove all listeners to this event.
	 */
	public clear() {
		this.#callbacks = [];
	}
}
