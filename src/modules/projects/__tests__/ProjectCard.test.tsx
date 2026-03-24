
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProjectCard from '../components/ProjectCard';
import { Project, User, Role } from '../types';

// Mock Project Data
const mockProject: Project = {
    id: 'p1',
    name: 'SCL Nhà điều hành NPSC',
    financialYear: 2024,
    isLocked: false,
    projectManagerIds: ['user1'],
    leadSupervisorIds: ['user2'],
    constructionStartDate: '01/01/2024',
    plannedAcceptanceDate: '31/12/2024',
    capitalPlanApproval: { decisionNumber: '123', date: '01/01/2024' },
    technicalPlanApproval: { decisionNumber: '', date: '' },
    budgetApproval: { decisionNumber: '', date: '' },
    designUnit: { companyName: '', personnelName: '', phone: '' },
    constructionUnit: { companyName: '', personnelName: '', phone: '' },
    supervisionUnit: { companyName: '', personnelName: '', phone: '' },
    supervisorA: { enterpriseName: '', personnelName: '', phone: '' }
};

const mockUserAdmin: User = {
    id: 'admin1',
    name: 'Admin User',
    email: 'admin@npsc.vn',
    role: Role.Admin
};

const mockUserManager: User = {
    id: 'user1',
    name: 'Manager User',
    email: 'manager@npsc.vn',
    role: Role.ProjectManager
};

describe('ProjectCard Component', () => {
    const onSelectProject = vi.fn();
    const onDeleteProject = vi.fn();

    it('renders project name and dates correctly', () => {
        render(
            <ProjectCard 
                project={mockProject} 
                currentUser={mockUserManager} 
                onSelectProject={onSelectProject} 
                onDeleteProject={onDeleteProject} 
            />
        );

        expect(screen.getByText('SCL Nhà điều hành NPSC')).toBeInTheDocument();
        expect(screen.getByText(/01\/01\/2024/)).toBeInTheDocument();
        expect(screen.getByText(/31\/12\/2024/)).toBeInTheDocument();
    });

    it('calls onSelectProject when clicked', () => {
        render(
            <ProjectCard 
                project={mockProject} 
                currentUser={mockUserManager} 
                onSelectProject={onSelectProject} 
                onDeleteProject={onDeleteProject} 
            />
        );

        fireEvent.click(screen.getByText('SCL Nhà điều hành NPSC'));
        expect(onSelectProject).toHaveBeenCalledWith('p1');
    });

    it('shows delete button only for Admin', () => {
        const { rerender } = render(
            <ProjectCard 
                project={mockProject} 
                currentUser={mockUserAdmin} 
                onSelectProject={onSelectProject} 
                onDeleteProject={onDeleteProject} 
            />
        );

        // Admin should see the delete button (checking for aria-label since icon might be hidden/svg)
        const deleteBtn = screen.getByLabelText(`Xóa dự án ${mockProject.name}`);
        expect(deleteBtn).toBeInTheDocument();

        // Project Manager should NOT see the delete button
        rerender(
            <ProjectCard 
                project={mockProject} 
                currentUser={mockUserManager} 
                onSelectProject={onSelectProject} 
                onDeleteProject={onDeleteProject} 
            />
        );
        expect(screen.queryByLabelText(`Xóa dự án ${mockProject.name}`)).not.toBeInTheDocument();
    });

    it('calculates status correctly for delayed project', () => {
        // Create a project that ended in the past but isn't marked complete
        const pastProject = {
            ...mockProject,
            constructionStartDate: '01/01/2020',
            plannedAcceptanceDate: '01/02/2020'
        };

        render(
            <ProjectCard 
                project={pastProject} 
                currentUser={mockUserManager} 
                onSelectProject={onSelectProject} 
                onDeleteProject={onDeleteProject} 
            />
        );

        // Expect to see "Quá hạn" text
        expect(screen.getByText(/Quá hạn/)).toBeInTheDocument();
        // Expect red color class (checking implementation detail slightly, but robust enough for visual status)
        expect(screen.getByText(/Quá hạn/).className).toContain('text-error');
    });
});
