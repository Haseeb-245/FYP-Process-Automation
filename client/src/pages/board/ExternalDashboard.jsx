// Add this test route at the end of projectRoutes.js (before module.exports)
router.get('/test-external', async (req, res) => {
    try {
        console.log('Test external endpoint hit');
        
        // Get all projects to see what's available
        const allProjects = await Project.find({})
            .populate('leaderId', 'name enrollment')
            .populate('supervisorId', 'name');
            
        // Check final defense status
        const projectsWithFinalDefense = allProjects.filter(p => p.finalDefense && p.finalDefense.finalPptUrl);
        
        res.json({
            totalProjects: allProjects.length,
            projectsWithFinalPPT: projectsWithFinalDefense.length,
            allProjects: allProjects.map(p => ({
                id: p._id,
                status: p.status,
                finalDefense: p.finalDefense,
                student: p.leaderId?.name
            })),
            projectsForExternal: projectsWithFinalDefense.map(p => ({
                id: p._id,
                status: p.status,
                finalPptUrl: p.finalDefense?.finalPptUrl,
                student: p.leaderId?.name
            }))
        });
    } catch (error) {
        console.error('Test error:', error);
        res.status(500).json({ error: error.message });
    }
});