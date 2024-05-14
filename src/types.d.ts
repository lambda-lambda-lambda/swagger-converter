/**
 *  lambda-lambda-lambda/swagger-converter
 *  Convert a Swagger/OpenAPI schema to a new L³ application.
 *
 *  Copyright 2024, Marc S. Brooks (https://mbrooks.info)
 *  Licensed under the MIT license:
 *  http://www.opensource.org/licenses/mit-license.php
 */

import {OpenAPI, OpenAPIV3} from 'openapi-types';

type valueof<T> = T[keyof T];

export declare namespace ApiSchema {
  export type Document        = OpenAPI.Document;
  export type OperationObject = OpenAPI.Operation;
  export type ResponseObject  = OpenAPIV3.ResponseObject;
  export type HttpMethod      = valueof<OpenAPIV3.HttpMethods>;
}
