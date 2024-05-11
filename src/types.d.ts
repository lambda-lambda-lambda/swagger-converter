/**
 *  lambda-lambda-lambda/swagger-converter
 *  Convert a Swagger/OpenAPI schema to a new L³ application.
 *
 *  Copyright 2024, Marc S. Brooks (https://mbrooks.info)
 *  Licensed under the MIT license:
 *  http://www.opensource.org/licenses/mit-license.php
 */

import {OpenAPIV3} from 'openapi-types';

type valueof<T> = T[keyof T];

export type HttpMethod = valueof<OpenAPIV3.HttpMethods>;
