import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
 
  if (req.url.includes('viacep.com.br')) {
  return next(req.clone({ withCredentials: false }));
  }
  return next(req.clone({ withCredentials: true }));

};
