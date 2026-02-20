import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { AuditLogsQueryDto } from './dto/audit-logs-query.dto';

describe('AuditController', () => {
  let controller: AuditController;
  let service: AuditService;

  const mockAuditService = {
    getAuditLogs: jest.fn(),
    getAuditStats: jest.fn(),
    exportAuditLogs: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    controller = module.get<AuditController>(AuditController);
    service = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAuditLogs', () => {
    it('should return audit logs with pagination', async () => {
      const query: AuditLogsQueryDto = { page: 1, limit: 10 };
      const expectedResult = {
        data: [
          {
            id: '1',
            userId: 'user1',
            action: 'CREATE',
            entityType: 'PROPERTY',
            entityId: 'prop1',
            createdAt: new Date().toISOString(),
            user: {
              id: 'user1',
              name: 'Test User',
              email: 'test@example.com',
              role: 'ADMIN',
            },
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
          nextPage: null,
          prevPage: null,
        },
      };

      mockAuditService.getAuditLogs.mockResolvedValue(expectedResult);

      const result = await controller.getAuditLogs(query);

      expect(service.getAuditLogs).toHaveBeenCalledWith(query);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getAuditStats', () => {
    it('should return audit statistics', async () => {
      const expectedStats = {
        totalLogs: 100,
        logsToday: 10,
        logsThisWeek: 50,
        topActions: [{ action: 'CREATE', count: 30 }],
        topEntities: [{ entityType: 'PROPERTY', count: 25 }],
        topUsers: [{ user: { name: 'Test User', email: 'test@example.com' }, count: 15 }],
        recentActivity: [],
      };

      mockAuditService.getAuditStats.mockResolvedValue(expectedStats);

      const result = await controller.getAuditStats();

      expect(service.getAuditStats).toHaveBeenCalled();
      expect(result).toEqual(expectedStats);
    });
  });

  describe('exportAuditLogs', () => {
    it('should return CSV export data', async () => {
      const query: AuditLogsQueryDto = { page: 1, limit: 10 };
      const expectedExport = {
        filename: 'audit-logs-2023-01-01.csv',
        data: 'ID,User Name,User Email,Action,Entity Type\n1,Test User,test@example.com,CREATE,PROPERTY',
      };

      mockAuditService.exportAuditLogs.mockResolvedValue(expectedExport);

      const result = await controller.exportAuditLogs(query);

      expect(service.exportAuditLogs).toHaveBeenCalledWith(query);
      expect(result).toEqual(expectedExport);
    });
  });
});
