// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

// Types for Cloudflare D1 and R2
declare global {
	interface D1Database {
		prepare(query: string): D1PreparedStatement;
	}

	interface D1PreparedStatement {
		bind(...values: unknown[]): D1PreparedStatement;
		all<T = unknown>(): Promise<D1Result<T>>;
		first<T = unknown>(colName?: string): Promise<T | null>;
		run(): Promise<D1Result<unknown>>;
		raw<T = unknown[]>(): Promise<T[]>;
	}

	interface D1Result<T = unknown> {
		results: T[];
		success: boolean;
		error?: string;
		meta?: {
			duration: number;
			last_row_id: number;
			changes: number;
		};
	}

	interface R2Bucket {
		put(key: string, value: ArrayBuffer | ReadableStream | string, options?: R2PutOptions): Promise<R2Object>;
		get(key: string): Promise<R2ObjectBody | null>;
		delete(key: string): Promise<void>;
		list(options?: R2ListOptions): Promise<R2Objects>;
	}

	interface R2PutOptions {
		httpMetadata?: {
			contentType?: string;
		};
	}

	interface R2Object {
		key: string;
		size: number;
		etag: string;
		uploaded: Date;
	}

	interface R2ObjectBody extends R2Object {
		body: ReadableStream;
		arrayBuffer(): Promise<ArrayBuffer>;
		text(): Promise<string>;
	}

	interface R2ListOptions {
		prefix?: string;
		limit?: number;
		cursor?: string;
	}

	interface R2Objects {
		objects: R2Object[];
		truncated: boolean;
		cursor?: string;
	}

	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env?: {
				DB?: D1Database;
				blog?: D1Database;
				'images-blog'?: R2Bucket;
				BLOG_ADMIN_PASSWORD?: string;
				LASTFM_API_KEY?: string;
			};
		}
	}
}

export {};
