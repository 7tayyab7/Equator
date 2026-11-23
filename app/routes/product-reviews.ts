import type {Route} from './+types/product-reviews';
import config from '../content/reviews-public.json';
import {submitProductReview} from '../lib/review-submission.server';
import {loadPublishedReviews} from '../lib/review-reader.server';
export async function action({request}:Route.ActionArgs){return submitProductReview(request,config.shop);}
export async function loader({request}:Route.LoaderArgs){return loadPublishedReviews(request);}
