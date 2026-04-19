import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireKycVerified } from '../middleware/verificationGuards.js';
import { requireAdmin } from '../middleware/rbac.js';
import { memoryUpload } from '../middleware/upload.js';
import * as authController from '../controllers/authController.js';
import * as kycController from '../controllers/kycController.js';
import * as companyController from '../controllers/companyController.js';
import * as conversationController from '../controllers/conversationController.js';
import * as trustController from '../controllers/trustController.js';
import * as reviewController from '../controllers/reviewController.js';
import * as uploadController from '../controllers/uploadController.js';

const router = Router();

router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', requireAuth, authController.me);

router.post(
  '/kyc/submit',
  requireAuth,
  memoryUpload.fields([
    { name: 'governmentId', maxCount: 1 },
    { name: 'selfie', maxCount: 1 },
  ]),
  kycController.submitKyc
);

router.post('/companies', requireAuth, requireKycVerified, companyController.createCompany);
router.get('/companies/mine', requireAuth, companyController.listMyCompanies);
router.post(
  '/companies/:id/registration-doc',
  requireAuth,
  memoryUpload.single('file'),
  companyController.uploadRegistrationDoc
);
router.post('/companies/:id/domain/verify', requireAuth, companyController.verifyDomain);
router.post('/companies/:id/representatives', requireAuth, companyController.inviteRepresentative);
router.patch('/companies/:id/representatives/:userId/approve', requireAuth, companyController.approveRepresentative);
router.patch('/companies/:id/representatives/:userId', requireAuth, companyController.updateRepresentativePermissions);
router.delete('/companies/:id/representatives/:userId', requireAuth, companyController.removeRepresentative);

router.get('/trust/summary', requireAuth, trustController.trustSummary);

router.post('/uploads/document', requireAuth, requireKycVerified, memoryUpload.single('file'), uploadController.uploadDocument);

router.post(
  '/conversations',
  requireAuth,
  requireKycVerified,
  conversationController.createConversation
);
router.post(
  '/conversations/from-company',
  requireAuth,
  requireKycVerified,
  conversationController.createConversationFromCompany
);
router.get('/conversations', requireAuth, conversationController.listConversations);
router.get('/conversations/:id', requireAuth, conversationController.getConversation);
router.get('/conversations/:id/messages', requireAuth, conversationController.listMessages);
router.post('/conversations/:id/messages', requireAuth, requireKycVerified, conversationController.sendMessage);
router.post('/conversations/:id/proceed-deal', requireAuth, requireKycVerified, conversationController.proceedToDeal);

router.post('/admin/kyc/:userId/review', requireAdmin, reviewController.reviewKyc);
router.post('/admin/companies/:companyId/review', requireAdmin, reviewController.reviewCompany);

export default router;
