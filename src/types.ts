import type { z, ZodSchema } from 'zod'

import type { default as Ajv, ValidateFunction } from 'ajv'

import type Context from './context'
import type KingWorldError from './error'

export type KWKey = string | number | symbol

export interface KingWorldInstance<
	Instance extends {
		store: Record<KWKey, any>
		request: Record<KWKey, any>
	} = {
		store: Record<KWKey, any>
		request: Record<KWKey, any>
	}
> {
	request: Instance['request']
	store: Instance['store']
}

export type Handler<
	Route extends TypedRoute = TypedRoute,
	Instance extends KingWorldInstance = KingWorldInstance
> = (
	context: Context<Route, Instance['store']> & Instance['request']
) => Route['response'] | Promise<Route['response']> | Response

export type LifeCycleEvent =
	| 'start'
	| 'request'
	| 'parse'
	| 'transform'
	| 'beforeHandle'
	| 'error'
	| 'stop'

export type VoidLifeCycle = (() => void) | (() => Promise<void>)

export type BodyParser = (request: Request) => any | Promise<any>

export interface LifeCycle<
	Instance extends KingWorldInstance = KingWorldInstance
> {
	start: VoidLifeCycle
	request: BeforeRequestHandler
	parse: BodyParser
	transform: Handler<any, Instance>
	beforeHandle: Handler<any, Instance>
	error: ErrorHandler
	stop: VoidLifeCycle
}

export interface LifeCycleStore<
	Instance extends KingWorldInstance = KingWorldInstance
> {
	start: VoidLifeCycle[]
	request: BeforeRequestHandler[]
	parse: BodyParser[]
	transform: Handler<any, Instance>[]
	beforeHandle: Handler<any, Instance>[]
	error: ErrorHandler[]
	stop: VoidLifeCycle[]
}

export type BeforeRequestHandler<Store extends Record<string, any> = {}> = (
	request: Request,
	store: Store
) => Response | Promise<Response>

export interface Hook<Instance extends KingWorldInstance = KingWorldInstance> {
	transform: Handler<any, Instance>[]
	beforeHandle: Handler<any, Instance>[]
	error: ErrorHandler[]
}

export interface RegisterHook<
	Route extends TypedRoute = TypedRoute,
	Instance extends KingWorldInstance = KingWorldInstance
> {
	transform?: Handler<Route, Instance> | Handler<Route, Instance>[]
	beforeHandle?: Handler<Route, Instance> | Handler<Route, Instance>[]
	error?: ErrorHandler
}

export interface TypedSchema<
	Schema extends {
		body: ZodSchema
		header: ZodSchema
		query: ZodSchema
		params: ZodSchema
		response: ZodSchema
	} = {
		body: ZodSchema
		header: ZodSchema
		query: ZodSchema
		params: ZodSchema
		response: ZodSchema
	}
> {
	body?: Schema['body']
	header?: Schema['header']
	query?: Schema['query']
	params?: Schema['params']
	response?: Schema['response']
}

export type UnwrapSchema<
	Schema extends ZodSchema | undefined,
	Fallback = unknown
> = Schema extends undefined ? Fallback : z.infer<NonNullable<Schema>>

export type TypedSchemaToRoute<Schema extends TypedSchema> = {
	body: UnwrapSchema<Schema['body']>
	header: UnwrapSchema<Schema['header']>
	query: UnwrapSchema<Schema['query']>
	params: UnwrapSchema<Schema['params']>
	response: UnwrapSchema<Schema['response']>
}

export type SchemaValidator = {
	body?: ValidateFunction
	header?: ValidateFunction
	query?: ValidateFunction
	params?: ValidateFunction
	response?: ValidateFunction
}

export type HookHandler<
	Schema extends TypedSchema = TypedSchema,
	Instance extends KingWorldInstance = KingWorldInstance
> = Handler<
	Omit<TypedSchemaToRoute<Schema>, 'response'> & {
		response: void | TypedSchemaToRoute<Schema>['response']
	},
	Instance
>

export interface LocalHook<
	Schema extends TypedSchema,
	Instance extends KingWorldInstance = KingWorldInstance
> {
	schema?: Schema
	transform?: HookHandler<Schema, Instance> | HookHandler<Schema, Instance>[]
	beforeHandle?: HookHandler<Schema, Instance> | HookHandler<Schema, Instance>
}

export type LocalHandler<
	Schema extends TypedSchema = TypedSchema,
	Instance extends KingWorldInstance = KingWorldInstance,
	Path extends string = string
> = Handler<
	Schema['params'] extends NonNullable<Schema['params']>
		? TypedSchemaToRoute<Schema>
		: Omit<TypedSchemaToRoute<Schema>, 'params'> & {
				params: Record<ExtractKWPath<Path>, string>
		  },
	Instance
>
export interface TypedRoute {
	body?: string | Record<string, any> | undefined
	header?: Record<string, unknown>
	query?: Record<string, string>
	params?: {}
	response?: unknown
}

export type ComposedHandler = {
	handle: Handler<any, any>
	hooks: Hook<any>
	validator: SchemaValidator
}

export interface KingWorldConfig {
	/**
	 * Defines the maximum payload, in bytes, the server is allowed to accept.
	 *
	 * @default 1048576 (1MB)
	 */
	bodyLimit: number
	/**
	 * If set to `true`, path will **NOT** try to map trailing slash with none.
	 *
	 * For example: `/group/` will not be map to `/group` or vice versa.
	 *
	 * @default false
	 */
	strictPath: boolean
	/**
	 * Custom ajv instance
	 */
	ajv: Ajv.Ajv
}

export type IsKWPathParameter<Part> = Part extends `:${infer Parameter}`
	? Parameter
	: never
export type ExtractKWPath<Path> = Path extends `${infer A}/${infer B}`
	? IsKWPathParameter<A> | ExtractKWPath<B>
	: IsKWPathParameter<Path>

export interface InternalRoute<Instance extends KingWorldInstance> {
	method: HTTPMethod
	path: string
	handler: Handler<any, Instance>
	hooks: Hook<Instance>
}

export type HTTPMethod =
	| 'ACL'
	| 'BIND'
	| 'CHECKOUT'
	| 'CONNECT'
	| 'COPY'
	| 'DELETE'
	| 'GET'
	| 'HEAD'
	| 'LINK'
	| 'LOCK'
	| 'M-SEARCH'
	| 'MERGE'
	| 'MKACTIVITY'
	| 'MKCALENDAR'
	| 'MKCOL'
	| 'MOVE'
	| 'NOTIFY'
	| 'OPTIONS'
	| 'PATCH'
	| 'POST'
	| 'PROPFIND'
	| 'PROPPATCH'
	| 'PURGE'
	| 'PUT'
	| 'REBIND'
	| 'REPORT'
	| 'SEARCH'
	| 'SOURCE'
	| 'SUBSCRIBE'
	| 'TRACE'
	| 'UNBIND'
	| 'UNLINK'
	| 'UNLOCK'
	| 'UNSUBSCRIBE'

export type ErrorCode =
	// ? Default 404
	| 'NOT_FOUND'
	// ? Default 502
	| 'INTERNAL_SERVER_ERROR'
	// ? Request exceed body limit (config.bodyLimit)
	| 'BODY_LIMIT'
	// ? Error that's not in defined list
	| 'UNKNOWN'

export type ErrorHandler = (errorCode: KingWorldError) => void | Response

// ? From https://dev.to/svehla/typescript-how-to-deep-merge-170c
type Head<T> = T extends [infer I, ...infer _Rest] ? I : never
type Tail<T> = T extends [infer _I, ...infer Rest] ? Rest : never

type Zip_DeepMergeTwoTypes<T, U> = T extends []
	? U
	: U extends []
	? T
	: [
			DeepMergeTwoTypes<Head<T>, Head<U>>,
			...Zip_DeepMergeTwoTypes<Tail<T>, Tail<U>>
	  ]

/**
 * Take two objects T and U and create the new one with uniq keys for T a U objectI
 * helper generic for `DeepMergeTwoTypes`
 */
type GetObjDifferentKeys<
	T,
	U,
	T0 = Omit<T, keyof U> & Omit<U, keyof T>,
	T1 = { [K in keyof T0]: T0[K] }
> = T1
/**
 * Take two objects T and U and create the new one with the same objects keys
 * helper generic for `DeepMergeTwoTypes`
 */
type GetObjSameKeys<T, U> = Omit<T | U, keyof GetObjDifferentKeys<T, U>>

type MergeTwoObjects<
	T,
	U,
	// non shared keys are optional
	T0 = Partial<GetObjDifferentKeys<T, U>> & { // shared keys are recursively resolved by `DeepMergeTwoTypes<...>`
		[K in keyof GetObjSameKeys<T, U>]: DeepMergeTwoTypes<T[K], U[K]>
	},
	T1 = { [K in keyof T0]: T0[K] }
> = T1

// it merge 2 static types and try to avoid of unnecessary options (`'`)
export type DeepMergeTwoTypes<T, U> =
	// ----- 2 added lines ------
	[T, U] extends [any[], any[]]
		? Zip_DeepMergeTwoTypes<T, U>
		: // check if generic types are objects
		[T, U] extends [{ [key: string]: unknown }, { [key: string]: unknown }]
		? MergeTwoObjects<T, U>
		: T | U
