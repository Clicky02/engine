import { UNIFORM_BUFFER_DEFAULT_SLOT_NAME } from './constants.js';

/** @typedef {import('./graphics-device.js').GraphicsDevice} GraphicsDevice */
/** @typedef {import('./texture.js').Texture} Texture */
/** @typedef {import('./bind-group-format.js').BindGroupFormat} BindGroupFormat */
/** @typedef {import('./uniform-buffer.js').UniformBuffer} UniformBuffer */

import { Debug } from '../core/debug.js';

/**
 * A bind group represents an collection of {@link UniformBuffer} and {@link Texture} instance,
 * which can be bind on a GPU for rendering.
 *
 * @ignore
 */
class BindGroup {
    /**
     * Create a new Bind Group.
     *
     * @param {GraphicsDevice} graphicsDevice - The graphics device used to manage this uniform buffer.
     * @param {BindGroupFormat} format - Format of the bind group.
     * @param {UniformBuffer} [defaultUniformBuffer] - The default uniform buffer. Typically a bind group only
     * has a single uniform buffer, and this allows easier access.
     */
    constructor(graphicsDevice, format, defaultUniformBuffer) {
        this.device = graphicsDevice;
        this.format = format;
        this.dirty = true;
        this.impl = graphicsDevice.createBindGroupImpl(this);

        this.textures = [];
        this.uniformBuffers = [];

        /** @type {UniformBuffer} */
        this.defaultUniformBuffer = defaultUniformBuffer;
        if (defaultUniformBuffer) {
            this.setUniformBuffer(UNIFORM_BUFFER_DEFAULT_SLOT_NAME, defaultUniformBuffer);
        }
    }

    /**
     * Frees resources associated with this bind group.
     */
    destroy() {
        this.impl.destroy();
        this.impl = null;
        this.format = null;
        this.defaultUniformBuffer = null;
    }

    /**
     * Assign a uniform buffer to a slot.
     *
     * @param {string} name - The name of the uniform buffer slot
     * @param {UniformBuffer} uniformBuffer - The Uniform buffer to assign to the slot.
     */
    setUniformBuffer(name, uniformBuffer) {
        const index = this.format.bufferFormatsMap.get(name);
        Debug.assert(index !== undefined, `Setting a uniform [${name}] on a bind group which does not contain in.`);
        if (this.uniformBuffers[index] !== uniformBuffer) {
            this.uniformBuffers[index] = uniformBuffer;
            this.dirty = true;
        }
    }

    /**
     * Assign a texture to a named slot.
     *
     * @param {string} name - The name of the texture slot.
     * @param {Texture} texture - Texture to assign to the slot.
     */
    setTexture(name, texture) {
        const index = this.format.textureFormatsMap.get(name);
        Debug.assert(index !== undefined, `Setting a texture [${name}] on a bind group which does not contain in.`);
        if (this.textures[index] !== texture) {
            this.textures[index] = texture;
            this.dirty = true;
        }
    }

    /**
     * Applies any changes made to the bind group's properties.
     */
    update() {

        const textureFormats = this.format.textureFormats;
        for (let i = 0; i < textureFormats.length; i++) {
            const textureFormat = textureFormats[i];
            const value = textureFormat.scopeId.value;
            Debug.assert(value, `Value was not set when assigning texture slot [${textureFormat.name}] to a bind group.`);
            this.setTexture(textureFormat.name, value);
        }

        if (this.dirty) {
            this.dirty = false;
            this.impl.update(this);
        }
    }
}

export { BindGroup };
