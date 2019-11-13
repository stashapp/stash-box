package manager

import (
	//"sync"

	"github.com/stashapp/stashdb/pkg/logger"
)

func (s *singleton) Import() {
	// if s.Status != Idle {
	// 	return
	// }
	// s.Status = Import

	// go func() {
	// 	defer s.returnToIdleState()

	// 	var wg sync.WaitGroup
	// 	wg.Add(1)
	// 	task := ImportTask{}
	// 	go task.Start(&wg)
	// 	wg.Wait()
	// }()
}

func (s *singleton) Export() {
	// if s.Status != Idle {
	// 	return
	// }
	// s.Status = Export

	// go func() {
	// 	defer s.returnToIdleState()

	// 	var wg sync.WaitGroup
	// 	wg.Add(1)
	// 	task := ExportTask{}
	// 	go task.Start(&wg)
	// 	wg.Wait()
	// }()
}

func (s *singleton) returnToIdleState() {
	if r := recover(); r != nil {
		logger.Info("recovered from ", r)
	}

	s.Status = Idle
}
