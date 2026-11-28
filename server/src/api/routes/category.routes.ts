import { Router } from 'express';
import { agreementController } from '../controllers/agreement.controller.js';
import { authenticate, requireOrgMember } from '../middlewares/auth.middleware.js';

export const categoryRouter = Router();

categoryRouter.use(authenticate, requireOrgMember);

// List categories (system defaults + org categories with template clauses count)
categoryRouter.get('/', (req, res, next) => agreementController.listCategories(req, res, next));

// Create organization category (Admin/Owner only)
categoryRouter.post('/', (req, res, next) => agreementController.createCategory(req, res, next));

// Update organization category
categoryRouter.put('/:id', (req, res, next) => agreementController.updateCategory(req, res, next));

// Delete organization category (fails if in use)
categoryRouter.delete('/:id', (req, res, next) => agreementController.deleteCategory(req, res, next));

// Template clauses for a category
categoryRouter.get('/:id/template-clauses', (req, res, next) => agreementController.getCategoryTemplateClauses(req, res, next));
categoryRouter.post('/:id/template-clauses', (req, res, next) => agreementController.createCategoryTemplateClause(req, res, next));
